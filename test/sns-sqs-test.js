import { expect } from "chai";
import dotenv from "dotenv";
import {
    getSnsPolicyActions,
    getSnsPolicyEffect,
    getSqsPolicyName,
    getSnsAttributes,
    getSnsTags,
    getSqsAttributes,
    getSqsTags,
    subscribeViaApi,
    getSubscriptions,
    unsubscribeViaApi,
} from "../helpers/sns-sqs-helper.js";
import {
    getAppInstanceProperty,
    getAppInstancePropertyForServerless,
} from "../helpers/get-app-instance-values.js";
import {
    getEffectForPolicy,
    getResourcesForPolicy,
    getActionsAllowedForPolicy,
} from "../helpers/get-policy-documents.js";
import {
    openConfirmationUrl,
    getLatestEmail,
    getLastEmailId,
} from "../helpers/get-emails.js";
import { authorize } from "../helpers/index.js";
import { uploadImage, deleteImageStatusCode } from "../helpers/s3-helper.js";

dotenv.config();

const topicArn = getAppInstanceProperty("TopicTopicArn");
const sqsQueueUrl = getAppInstanceProperty("QueueQueueUrl");
const appInstanceId = getAppInstanceProperty("AppInstanceInstanceId");

const snsParams = {
    TopicArn: topicArn,
};

const sqsParams = {
    QueueUrl: sqsQueueUrl,
    AttributeNames: ["All"],
};

describe("application instance requirements should be correct", () => {
    it("should use SNS topic to subscribe", async () => {
        const actions = await getSnsPolicyActions(snsParams);
        expect(actions).to.contain("SNS:Subscribe");
    });

    it("should use SNS topic to unsubscribe", async () => {
        const actions = await getSnsPolicyActions(snsParams);
        expect(actions).to.contain("SNS:DeleteTopic");
    });

    it("should use SNS topic to list subscriptions", async () => {
        const actions = await getSnsPolicyActions(snsParams);
        expect(actions).to.contain("SNS:ListSubscriptionsByTopic");
    });

    it("should send an e-mail to subscribers about image upload/delete", async () => {
        const actions = await getSnsPolicyActions(snsParams);
        expect(actions).to.contain("SNS:Publish");
    });

    it("should have 'Allow' effect for policy actions", async () => {
        const actions = await getSnsPolicyEffect(snsParams);
        expect(actions).to.equal("Allow");
    });

    it("should use an SQS queue to publish event messages", async () => {
        const sqsAttributes = await getSqsAttributes(sqsParams);
        expect(
            parseInt(sqsAttributes.MessageRetentionPeriod)
        ).to.be.greaterThan(0);
    });
});

describe("application should have access to the SQS queue and SNS topic via IAM roles", () => {
    it("actions allowed for sqs should be sns:Publish", async () => {
        const sqsPolicyName = await getSqsPolicyName(appInstanceId);
        const actionsAllowed = await getActionsAllowedForPolicy(sqsPolicyName);
        expect(actionsAllowed).to.eql("sns:Publish");
    });

    it("the effect should be 'Allow'", async () => {
        const sqsPolicyName = await getSqsPolicyName(appInstanceId);
        const effect = await getEffectForPolicy(sqsPolicyName);
        expect(effect).to.equal("Allow");
    });

    it("the topic arn should be in the resources", async () => {
        const topicArn = await getAppInstanceProperty("TopicTopicArn");
        const sqsPolicyName = await getSqsPolicyName(appInstanceId);
        const resources = await getResourcesForPolicy(sqsPolicyName);
        expect(resources).to.equal(topicArn);
    });
});

describe("SNS topic requirements should be correct", () => {
    it("should have the Name attirubute: cloudximage-TopicSNSTopic{unique id}", async () => {
        const snsAttributes = await getSnsAttributes();
        const topicArn = snsAttributes.Attributes.TopicArn;
        expect(topicArn).to.match(/.*cloudximage-TopicSNSTopic[a-zA-Z0-9-]+$/);
    });

    it("should have the Type: standard", async () => {
        const snsAttributes = await getSnsAttributes();
        const topicArn = snsAttributes.Attributes.TopicArn;
        expect(topicArn).to.not.have.string("fifo");
    });

    it("should have the Encryption disabled", async () => {
        const snsAttributes = await getSnsAttributes();
        expect(snsAttributes.Attributes).to.not.have.property("KmsMasterKeyId");
    });

    it("should have the Tags: cloudx: qa", async () => {
        expect(await getSnsTags()).to.deep.include({
            Key: "cloudx",
            Value: "qa",
        });
    });
});

describe("SQS queue requirements should be correct", () => {
    it("should have the Name attribute: cloudximage-QueueSQSQueue{unique id}", async () => {
        const sqsAttributes = await getSqsAttributes();
        const queueArn = sqsAttributes.QueueArn;
        expect(queueArn).to.match(/.*cloudximage-QueueSQSQueue[a-zA-Z0-9-]+$/);
    });

    it("should have the Encryption disabled", async () => {
        const sqsAttributes = await getSqsAttributes();
        expect(sqsAttributes).to.have.property("SqsManagedSseEnabled");
    });

    it("should have the Type: standard", async () => {
        const sqsAttributes = await getSqsAttributes();
        expect(sqsAttributes.QueueArn).to.not.have.string("fifo");
    });

    it("should have the Tags: cloudx: qa", async () => {
        const sqsTags = await getSqsTags();
        expect(sqsTags).to.deep.equal({ cloudx: "qa" });
    });

    it("should not have Dead-letter queue", async () => {
        const sqsAttributes = await getSqsAttributes();
        expect(sqsAttributes).to.not.have.property("RedrivePolicy");
    });
});

describe("Application functional validation should be correct", () => {
    const appPublicIp = getAppInstancePropertyForServerless(
        "AppInstancePublicIp"
    );
    const myEmail = process.env.MY_EMAIL;

    it("should be able to subscribe users using the application API", async () => {
        expect(await subscribeViaApi(appPublicIp, myEmail)).to.equal(200);
    });

    it("should be able to list subscriptions", async () => {
        const subscriptions = await getSubscriptions(appPublicIp);
        expect(subscriptions.status).to.equal(200);
        expect(subscriptions.data[0].Endpoint).to.equal(myEmail);
    });

    it("should use email protocol to send notifications", async () => {
        const subscriptions = await getSubscriptions(appPublicIp);
        expect(subscriptions.data[0].Protocol).to.equal("email");
    });

    it("should be forced to confirm the subscription", async () => {
        const subscriptions = await getSubscriptions(appPublicIp);
        expect(subscriptions.data[0].SubscriptionArn).to.equal(
            "PendingConfirmation"
        );
    });

    it("should send notification about image upload after the subscription is confirmed", async () => {
        const auth = await authorize();

        await openConfirmationUrl(auth);
        await uploadImage(appPublicIp, "./test.jpg");

        const lastEmail = await getLatestEmail(auth);
        expect(lastEmail).to.contain("event_type: upload");
    });

    it("should send notification about image removal after the subscription is confirmed", async () => {
        const auth = await authorize();

        await deleteImageStatusCode(appPublicIp);
        const lastEmail = await getLatestEmail(auth);
        expect(lastEmail).to.contain("event_type: delete");
    });

    it("should contain the correct metadata", async () => {
        const auth = await authorize();
        const lastEmail = await getLatestEmail(auth);
        expect(lastEmail).to.contain("object_key");
        expect(lastEmail).to.contain("object_type");
        expect(lastEmail).to.contain("last_modified");
        expect(lastEmail).to.contain("object_size");
        expect(lastEmail).to.contain("download_link");
    });

    it("should be able to unsubscribe users using the application API", async () => {
        expect(await unsubscribeViaApi(appPublicIp, myEmail)).to.equal(200);
        const subscirptions = await getSubscriptions(appPublicIp);
        expect(subscirptions.status).to.equal(200);
        expect(subscirptions.data).to.be.empty;
    });

    it("should not receive notification about image upload after unsubscribing", async () => {
        const auth = await authorize();
        const lastEmailIdBeforeUpload = await getLastEmailId(auth);

        await uploadImage(appPublicIp, "./test.jpg");
        const lastEmailIdAfterUpload = await getLastEmailId(auth);
        expect(lastEmailIdBeforeUpload).to.equal(lastEmailIdAfterUpload);
    });

    it("should not receive notification about image removal after unsubscribing", async () => {
        const auth = await authorize();
        const lastEmailIdBeforeUpload = await getLastEmailId(auth);

        await deleteImageStatusCode(appPublicIp);
        const lastEmailIdAfterUpload = await getLastEmailId(auth);
        expect(lastEmailIdBeforeUpload).to.equal(lastEmailIdAfterUpload);
    });
});

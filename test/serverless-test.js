import { expect } from "chai";

import { getAppInstancePropertyForServerless } from "../helpers/get-app-instance-values.js";

import {
    getTableDetails,
    getTimeToLive,
    getTagsForDynamoDb,
    getLambdaFunction,
    getEventSourceMappings,
    getTagsForLambda,
    getIamRoleNameForLambda,
} from "../helpers/serverless-basics.js";
import {
    uploadImage,
    deleteImageStatusCode,
    getImages,
    getS3PolicyName,
} from "../helpers/s3-helper.js";
import {
    getSnsPolicyActions,
    getSnsPolicyEffect,
    getSqsAttributes,
    getSnsPolicyName,
    getInstanceProfileByArn,
} from "../helpers/sns-sqs-helper.js";
import {
    getEffectForPolicy,
    getResourcesForPolicy,
    getActionsAllowedForPolicy,
    getIAMPolicies,
} from "../helpers/get-policy-documents.js";
import { getRunningInstanceDetails } from "../helpers/get-ec2-instances.js";
import {
    getPoliciesForRole,
    getRolePolicy,
} from "../helpers/get-policy-documents.js";
import { getAttachedPolicies } from "../helpers/get-policies-for-role.js";

const databaseTableName =
    getAppInstancePropertyForServerless("DatabaseTableName");
const instancePublicIp = getAppInstancePropertyForServerless(
    "AppInstancePublicIp"
);
const topicArn = getAppInstancePropertyForServerless("TopicTopicArn");
const sqsQueueUrl = getAppInstancePropertyForServerless("QueueQueueUrl");
const appInstanceId = getAppInstancePropertyForServerless(
    "AppInstanceInstanceId"
);
const bucketName = getAppInstancePropertyForServerless(
    "ImageStoreImageBucketName"
);
const queueUrl = getAppInstancePropertyForServerless("QueueQueueUrl");

const snsParams = {
    TopicArn: topicArn,
};

const sqsParams = {
    QueueUrl: sqsQueueUrl,
    AttributeNames: ["All"],
};

describe("DynamoDB requirements should be correct", () => {
    it("should have the name 'cloudxserverless-DatabaseImagesTable{unique id}'", async () => {
        const dbMetadata = await getTableDetails(databaseTableName);
        expect(dbMetadata.TableName).to.match(
            /.*cloudxserverless-DatabaseImagesTable[a-zA-Z0-9-]+$/
        );
    });

    it("should not have global secondary indexes enabled", async () => {
        const dbMetadata = await getTableDetails(databaseTableName);
        expect(dbMetadata).to.not.have.property("GlobalSecondaryIndexes");
    });

    it("should have read capacity units of 5", async () => {
        const dbMetadata = await getTableDetails(databaseTableName);
        expect(dbMetadata.ProvisionedThroughput.ReadCapacityUnits).to.equal(5);
    });

    it("should have write capacity units of 5", async () => {
        const dbMetadata = await getTableDetails(databaseTableName);
        expect(dbMetadata.ProvisionedThroughput.WriteCapacityUnits).to.equal(5);
    });

    it("should have Time to Live disabled", async () => {
        const dbTimeToLive = await getTimeToLive(databaseTableName);
        expect(dbTimeToLive.TimeToLiveStatus).to.equal("DISABLED");
    });

    it("should have the cloudx: qa tag", async () => {
        const tagsForDynamoDb = await getTagsForDynamoDb(databaseTableName);
        expect(tagsForDynamoDb).to.deep.include({
            Key: "cloudx",
            Value: "qa",
        });
    });
});

describe("DynamoDB table should return the correct image metadata information", () => {
    let imageMetadata;

    before(async () => {
        await uploadImage(instancePublicIp, "./test.jpg");
        imageMetadata = await getImages(instancePublicIp);
    });

    after(async () => {
        await deleteImageStatusCode(instancePublicIp);
    });

    it("should return object creation time", async () => {
        expect(imageMetadata.data[0]).to.have.property("created_at");
    });

    it("should return object last modification date-time", async () => {
        expect(imageMetadata.data[0]).to.have.property("last_modified");
    });

    it("should return object key", async () => {
        expect(imageMetadata.data[0]).to.have.property("object_key");
    });

    it("should return object size", async () => {
        expect(imageMetadata.data[0]).to.have.property("object_size");
    });

    it("should return object type", async () => {
        expect(imageMetadata.data[0]).to.have.property("object_type");
    });
});

describe("SNS topic should be used for actions", () => {
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

describe("a lambda function should be subscribed to the SQS queue to filter and put event message to the SNS topic", () => {
    it("should be subscribed to SQS Queue", async () => {
        const eventSourceMapping = await getEventSourceMappings();
        expect(eventSourceMapping.EventSourceArn).to.contain("arn:aws:sqs");
    });

    it("should be connected to the SNS Topic", async () => {
        const lambdaRoleName = await getIamRoleNameForLambda();
        const attachedPolicies = await getAttachedPolicies(lambdaRoleName);
        let policy = attachedPolicies.find((policy) =>
            policy.PolicyName.includes("TopicPublishPolicy")
        );
        const policies = await getIAMPolicies(policy.PolicyName);
        expect(policies[0].Action).to.contain("sns:");
        expect(policies[0].Resource).to.equal(topicArn);
        expect(policies[0].Effect).to.equal("Allow");
    });
});

describe("application should have access to the S3 Bucket, DynamoDB, SQS Queue, SNS topic instance via IAM roles", () => {
    it("should have access to the SNS topic via an IAM role", async () => {
        const snsPolicyName = await getSnsPolicyName(appInstanceId);
        const actionsAllowed = await getActionsAllowedForPolicy(snsPolicyName);
        const policyResource = await getResourcesForPolicy(snsPolicyName);
        const policyEffect = await getEffectForPolicy(snsPolicyName);
        expect(actionsAllowed).to.include.members([
            "sns:ListSubscriptions*",
            "sns:Subscribe",
            "sns:Unsubscribe",
        ]);
        expect(policyResource).to.equal(topicArn);
        expect(policyEffect).to.equal("Allow");
    });

    it("should have access to S3 via an IAM role", async () => {
        const s3PolicyName = await getS3PolicyName(appInstanceId);
        const actionsAllowed = await getActionsAllowedForPolicy(s3PolicyName);
        const policyResource = await getResourcesForPolicy(s3PolicyName);
        const policyEffect = await getEffectForPolicy(s3PolicyName);
        expect(actionsAllowed).to.contain("s3:ListBucket");
        expect(policyResource).to.equal(`arn:aws:s3:::${bucketName}`);
        expect(policyEffect).to.equal("Allow");
    });

    it("should have access to the DynamoDB Table", async () => {
        const instanceDetails = await getRunningInstanceDetails();
        const iamProfileArn = instanceDetails[0].IamInstanceProfile.Arn;
        const instanceProfiles = await getInstanceProfileByArn(iamProfileArn);
        const roleName = await instanceProfiles[0].Roles[0].RoleName;
        const policiesForRole = await getPoliciesForRole(roleName);
        const policyName = policiesForRole.PolicyNames[0];
        const rolePolicy = await getRolePolicy(roleName, policyName);
        const policyDocument = JSON.parse(
            decodeURIComponent(rolePolicy.PolicyDocument)
        );
        const foundStatement = policyDocument.Statement.find(
            (statement) =>
                statement.Action.includes("dynamodb:Scan") &&
                statement.Resource[0].includes(databaseTableName) &&
                statement.Effect === "Allow"
        );
        expect(foundStatement).to.not.be.undefined;
    });

    it("should have access to the SQS Queue", async () => {
        const instanceDetails = await getRunningInstanceDetails();
        const iamProfileArn = instanceDetails[0].IamInstanceProfile.Arn;
        const instanceProfiles = await getInstanceProfileByArn(iamProfileArn);
        const roleName = await instanceProfiles[0].Roles[0].RoleName;
        const policiesForRole = await getPoliciesForRole(roleName);
        const policyName = policiesForRole.PolicyNames[0];
        const rolePolicy = await getRolePolicy(roleName, policyName);
        const policyDocument = JSON.parse(
            decodeURIComponent(rolePolicy.PolicyDocument)
        );
        const queueUrlParts = queueUrl.split("/");
        const resourceIdentifier = queueUrlParts[queueUrlParts.length - 1];
        const foundStatement = policyDocument.Statement.find(
            (statement) =>
                statement.Action.includes("sqs:SendMessage") &&
                statement.Resource.includes(resourceIdentifier) &&
                statement.Effect === "Allow"
        );
        expect(foundStatement).to.not.be.undefined;
    });
});

describe("AWS Lambda Requirements should be correct", () => {
    it("should have the trigger: SQS Queue", async () => {
        const eventSourceMapping = await getEventSourceMappings();
        expect(eventSourceMapping.EventSourceArn).to.contain("arn:aws:sqs");
    });

    it("should have the application logs stored in CloudWatch log group: 'aws/lambda/cloudxserverless-EventHandlerLambda{unique id}'", async () => {
        const lambda = await getLambdaFunction();
        expect(lambda.LoggingConfig.LogGroup).to.match(
            /^(\/aws\/lambda\/cloudxserverless-EventHandlerLambda)([A-Za-z0-9-]+)$/
        );
    });

    it("should have memory size of 128MB", async () => {
        const lambda = await getLambdaFunction();
        expect(lambda.MemorySize).to.equal(128);
    });

    it("should have ephemeral storage of 512MB", async () => {
        const lambda = await getLambdaFunction();
        expect(lambda.EphemeralStorage.Size).to.equal(512);
    });

    it("should have 3 seconds timeout", async () => {
        const lambda = await getLambdaFunction();
        expect(lambda.Timeout).to.equal(3);
    });

    it("should have the tags cloudx: qa", async () => {
        const lambdaTags = await getTagsForLambda();
        expect(lambdaTags).to.deep.include({
            cloudx: "qa",
        });
    });
});

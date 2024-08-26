import { expect } from "chai";

import {
    getLogGroups,
    getLoggingStatus,
    getCloudTrailTrails,
    getTrailDetails,
    getTrailTags,
    getAllLogEvents,
    sleep,
} from "../helpers/monitoring-logging.js";
import {
    uploadImage,
    getImagesStatusCode,
    downloadImageStatusCode,
    deleteImageStatusCode,
    getImages,
    getSpecificImage
} from "../helpers/s3-helper.js";
import {
    subscribeViaApi,
    getSubscriptions,
    unsubscribeViaApi
} from "../helpers/sns-sqs-helper.js";
import { getLambdaFunction } from "../helpers/serverless-basics.js";
import { getAppInstancePropertyForServerless } from "../helpers/get-app-instance-values.js";
import { authorize } from "../helpers/index.js";
import { openConfirmationUrl } from "../helpers/get-emails.js";

const instancePublicIp = getAppInstancePropertyForServerless(
    "AppInstancePublicIp"
);
const myEmail = process.env.MY_EMAIL;

describe("deployment validation", () => {
    it("the application should EC2 instance shuold have CloudWatch integration", async () => {
        const logGroups = await getLogGroups();
        expect(logGroups).to.not.be.empty;
    });

    it("should have the cloud-init logs by instance ID", async () => {
        const logStreamNamesForUsEast = await getLogGroups(
            "/var/log/cloud-init",
            "us-east-1"
        );
        expect(logStreamNamesForUsEast[0].logGroupName).to.equal(
            "/var/log/cloud-init"
        );
    });

    it("should have the cloudxserverless-app logs by instance ID (private DNS???)", async () => {
        const logStreamNamesEuCentral1 = await getLogGroups(
            "/var/log/cloudxserverless-app"
        );
        expect(logStreamNamesEuCentral1[0].logGroupName).to.equal(
            "/var/log/cloudxserverless-app"
        );
    });

    it("should have the cloudxserverless-EventHandlerLambda{unique id} for the event handler lambda", async () => {
        const lambdaFunction = await getLambdaFunction();
        expect(lambdaFunction.LoggingConfig.LogGroup).to.match(
            /^\/aws\/lambda\/cloudxserverless-EventHandlerLambda[\w-]+$/
        );
    });

    it("should ahve CloudTrail enabled", async () => {
        const loggingStatus = await getLoggingStatus();
        expect(loggingStatus.IsLogging).to.be.true;
    });
});

describe("CloudTrail trail requirements should be correct", () => {
    let trailConfig;

    before(async () => {
        const trails = await getCloudTrailTrails();
        trailConfig = trails.trailList[0];
    });

    it("should have the name 'cloudxserverless-Trail{unique id}'", async () => {
        expect(trailConfig.Name).to.match(/^cloudxserverless-Trail[\w-]+$/);
    });

    it("should have Multi-region enabled", async () => {
        expect(trailConfig.IsMultiRegionTrail).to.be.true;
    });

    it("should have log file validation enabled", async () => {
        expect(trailConfig.LogFileValidationEnabled).to.be.true;
    });

    it("should have SSE-KMS encryption enabled", async () => {
        const trailDetails = await getTrailDetails();
        expect(trailDetails.Trail).to.not.have.property("KmsKeyId");
    });

    it("should have cloudx: qa tags", async () => {
        const tags = await getTrailTags();
        expect(tags).to.deep.include({
            Key: "cloudx",
            Value: "qa",
        });
    });
});

describe("Functional requirements should be correct - Notification", () => {
    it("should log the processed API requests in the cloudxserverless-app log group (subscribe)", async() => {
        await subscribeViaApi(instancePublicIp, myEmail);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include(`POST /api/notification/${myEmail}`);
    });

    it("should log the processed API requests in the cloudxserverless-app log group (list subscriptions)", async() => {
        await getSubscriptions(instancePublicIp);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include(`GET /api/notification`);
    });

    it("should log the processed API requests in the cloudxserverless-app log group (unsubscribe)", async() => {
        await unsubscribeViaApi(instancePublicIp, myEmail)
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include(`DELETE /api/notification/${myEmail}`);
    });
})

describe("Functional requirements should be correct - Image", () => {
    const expectedSubstrings = [
        "object_key",
        "object_type",
        "last_modified",
        "object_size",
        "download_link",
    ];

    before(async () => {
        const subscirptions = await getSubscriptions(instancePublicIp);
        if (
            subscirptions.data.length == 0 ||
            subscirptions.data[0].SubscriptionArn == "PendingConfirmation"
        ) {
            await subscribeViaApi(instancePublicIp, myEmail);
            const auth = await authorize();
            await openConfirmationUrl(auth);
        }
    });

    it("should process CloudWatch logs in the Event Handler Lambda (image upload)", async () => {
        await uploadImage(instancePublicIp, "./test.jpg");
        const lambdaFunc = await getLambdaFunction();
        const loggingGroup = lambdaFunc.LoggingConfig.LogGroup;
        const logs = await getAllLogEvents(loggingGroup);
        const allLogMessages = logs.map((log) => log.message);

        expectedSubstrings.forEach((expected) => {
            const found = allLogMessages.some((message) =>
                message.includes(expected)
            );
            expect(found).to.be.true;
        });
    });

    it("should process CloudWatch logs in the Event Handler Lambda (image removal)", async () => {
        await deleteImageStatusCode(instancePublicIp);
        const lambdaFunc = await getLambdaFunction();
        const loggingGroup = lambdaFunc.LoggingConfig.LogGroup;
        const logs = await getAllLogEvents(loggingGroup);
        const allLogMessages = logs.map((log) => log.message);

        expectedSubstrings.forEach((expected) => {
            const found = allLogMessages.some((message) =>
                message.includes(expected)
            );
            expect(found).to.be.true;
        });
    });

    it("should log the processed API requests in the cloudxserverless-app log group (image upload)", async () => {
        await uploadImage(instancePublicIp, "./test.jpg");
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include("POST /api/image");
    });

    it("should log the processed API requests in the cloudxserverless-app log group (image download)", async () => {
        await downloadImageStatusCode(instancePublicIp);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include("GET /api/image/file/");
    });

    it("should log the processed API requests in the cloudxserverless-app log group (image get - all)", async () => {
        await getImagesStatusCode(instancePublicIp);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include("GET /api/image HTTP/1.1");
    });

    it("should log the processed API requests in the cloudxserverless-app log group (image get - specific)", async () => {
        const images = await getImages(instancePublicIp);
        const firstImageId = images.data[0].id;
        await getSpecificImage(instancePublicIp, firstImageId);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include("GET /api/image/");
    });

    it("should log the processed API requests in the cloudxserverless-app log group (image removal)", async () => {
        await deleteImageStatusCode(instancePublicIp);
        await sleep(55);
        const logEvents = await getAllLogEvents(
            "/var/log/cloudxserverless-app"
        );
        const lastMessage = logEvents[logEvents.length - 1]?.message;
        expect(lastMessage).to.include("DELETE /api/image");
    });
});

import AWS from "aws-sdk";
import { getAppInstancePropertyForServerless } from "./get-app-instance-values.js";

AWS.config.update({ region: "eu-central-1" });

const dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const sts = new AWS.STS();
const documentClient = new AWS.DynamoDB.DocumentClient();
var iam = new AWS.IAM({ apiVersion: "2010-05-08" });
const lambdaClient = new AWS.Lambda();

const databaseTableName =
    getAppInstancePropertyForServerless("DatabaseTableName");
const topicArn = getAppInstancePropertyForServerless("TopicTopicArn");

export const getTableDetails = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    try {
        const data = await dynamodb.describeTable(params).promise();
        return data.Table;
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

export const getTimeToLive = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    try {
        const data = await dynamodb.describeTimeToLive(params).promise();
        return data.TimeToLiveDescription;
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

export const getTagsForDynamoDb = async () => {
    const region = AWS.config.region;
    const dbMetadata = await getTableDetails(databaseTableName);
    const tableName = dbMetadata.TableName;
    const callerIdentity = await sts.getCallerIdentity({}).promise();
    const accountId = callerIdentity.Account;

    const params = {
        ResourceArn: `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`,
    };

    try {
        const data = await dynamodb.listTagsOfResource(params).promise();
        return data.Tags;
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

export const getDataFromTable = async (tableName) => {
    const params = {
        TableName: tableName,
        Limit: 1,
    };

    try {
        const data = await documentClient.scan(params).promise();
        return data;
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

const getIamRoles = async () => {
    const roles = iam.listRoles({}).promise();
    return roles;
};

export const getIamRoleNameForLambda = async () => {
    const iamRoles = (await getIamRoles()).Roles;
    const lambdaRole = iamRoles.find((role) =>
        role.RoleName.includes("EventHandlerLambdaRole")
    );
    return lambdaRole.RoleName;
};

//Currently not used, but seems to be working, need to find the correct PolicySourceArns to be passed
export const simulatePolicy = async () => {
    const params = {
        ActionNames: [
            "sns:Subscribe",
            "sns:Unsubscribe",
            "sns:ListSubscriptionsByTopic",
            "sns:Publish",
            "sns:DeleteTopic",
        ],
        PolicySourceArn:
            "",
        ResourceArns: [topicArn],
    };

    try {
        const data = await iam.simulatePrincipalPolicy(params).promise();
        data.EvaluationResults.forEach((result) => {
            console.log(`Action: ${result.EvalActionName}`);
            console.log(`Allowed: ${result.EvalDecision}`);
            console.log("----------------------");
        });
    } catch (error) {
        console.log("Error", error);
    }
};

export const getLambdaFunction = async () => {
    try {
        const data = await lambdaClient.listFunctions({}).promise();
        return data.Functions.find(
            (func) =>
                func.FunctionName &&
                func.FunctionName.includes(
                    "cloudxserverless-EventHandlerLambda"
                )
        );
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

export const getEventSourceMappings = async () => {
    const lambdaFunctionProperties = await getLambdaFunction();
    const params = {
        FunctionName: lambdaFunctionProperties.FunctionName,
    };

    try {
        const data = await lambdaClient
            .listEventSourceMappings(params)
            .promise();
        return data.EventSourceMappings[0];
    } catch (error) {
        console.error(`An error occured: ${error}`);
    }
};

export const getTagsForLambda = async () => {
    const region = AWS.config.region;
    const lambdaFunctionProperties = await getLambdaFunction();
    const functioName = lambdaFunctionProperties.FunctionName;
    const callerIdentity = await sts.getCallerIdentity({}).promise();
    const accountId = callerIdentity.Account;

    const params = {
        Resource: `arn:aws:lambda:${region}:${accountId}:function:${functioName}`,
    };

    const data = await lambdaClient.listTags(params).promise();
    return data.Tags;
};

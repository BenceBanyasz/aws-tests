import AWS from "aws-sdk";
import dotenv from "dotenv";
import { getEC2InstanceForId } from "./get-ec2-instances.js";
import { getAppInstanceProperty, getAppInstancePropertyForServerless } from "./get-app-instance-values.js";
import { getAttachedPolicies } from "./get-policies-for-role.js";
import axios from "axios";
dotenv.config();

AWS.config.update({ region: "eu-central-1" });

const sns = new AWS.SNS();
const sqs = new AWS.SQS();
const iam = new AWS.IAM();

const topicArn = getAppInstancePropertyForServerless("TopicTopicArn");
const sqsQueueUrl = getAppInstancePropertyForServerless("QueueQueueUrl");
const appInstanceId = getAppInstancePropertyForServerless("AppInstanceInstanceId");

const snsParams = {
    TopicArn: topicArn,
};

const snsParamsForTags = {
    ResourceArn: topicArn,
};

const sqsParams = {
    QueueUrl: sqsQueueUrl,
    AttributeNames: ["All"],
};

export const getTopics = async () => {
    const topics = await sns.listTopics().promise();
    return topics;
};

export const listSubscriptions = async () => {
    const subscriptionsByTopic = await sns
        .listSubscriptionsByTopic(snsParams)
        .promise();
    return subscriptionsByTopic;
};

export const isUsingSqsQueue = async () => {
    const receiveMessage = await sqs.receiveMessage(sqsParams).promise();
    return receiveMessage.Messages;
};

export const getSnsAttributes = async (snsParams) => {
    const snsAttributes = await sns.getTopicAttributes(snsParams).promise();
    return snsAttributes;
};

export const getSnsPolicyActions = async (snsParams) => {
    const snsAttributes = await getSnsAttributes(snsParams);
    const parsedPolicy = JSON.parse(snsAttributes.Attributes.Policy);
    return parsedPolicy.Statement[0].Action;
};

export const getSnsPolicyEffect = async (snsParams) => {
    const snsAttributes = await getSnsAttributes(snsParams);
    const parsedPolicy = JSON.parse(snsAttributes.Attributes.Policy);
    return parsedPolicy.Statement[0].Effect;
};

export const getSnsTags = async () => {
    const snsTags = await sns.listTagsForResource(snsParamsForTags).promise();
    return snsTags.Tags;
};

export const getSqsAttributes = async (sqsParams) => {
    const sqsAttributes = await sqs.getQueueAttributes(sqsParams).promise();
    return sqsAttributes.Attributes;
};

export const getSqsTags = async () => {
    const sqsTags = await sqs
        .listQueueTags({ QueueUrl: sqsParams.QueueUrl })
        .promise();
    return sqsTags.Tags;
};

const getIamInstanceProfileArn = async (appInstanceId) => {
    const instance = await getEC2InstanceForId([appInstanceId]);
    return instance[0].iamProfile.Arn;
};

export const getInstanceProfile = async (appInstanceId) => {
    const arn = await getIamInstanceProfileArn(appInstanceId);
    const instanceProfiles = await iam.listInstanceProfiles().promise();
    return instanceProfiles.InstanceProfiles.find(
        (profile) => profile.Arn === arn
    );
};

export const getInstanceProfileByArn = async(instanceProfileArn) => {
    const instanceProfiles = await iam.listInstanceProfiles().promise();
    return instanceProfiles.InstanceProfiles.filter((profile) => {
        return profile.Arn === instanceProfileArn
    })
}

export const getRoleName = async (appInstanceId) => {
    const instanceProfile = await getInstanceProfile(appInstanceId);
    return instanceProfile.Roles[0].RoleName;
};

export const getSqsPolicyName = async (appInstanceId) => {
    const roleName = await getRoleName(appInstanceId);
    const attachedPolicies = await getAttachedPolicies(roleName);
    const sqsPolicy = attachedPolicies.find((policy) =>
        policy.PolicyName.includes("cloudximage-TopicPublishPolicy")
    );
    return sqsPolicy.PolicyName;
};

export const getSnsPolicyName = async (appInstanceId) => {
    const roleName = await getRoleName(appInstanceId);
    const attachedPolicies = await getAttachedPolicies(roleName);
    const sqsPolicy = attachedPolicies.find((policy) =>
        policy.PolicyName.includes(
            "cloudxserverless-TopicSubscriptionPolicy" ||
                "cloudximage-TopicPublishPolicy"
        )
    );
    return sqsPolicy.PolicyName;
};

export const subscribeViaApi = async (instancePublicIP, email) => {
    const url = `http://${instancePublicIP}/api/notification/${email}`;
    const response = await axios.post(url);
    return await response.status;
};

export const unsubscribeViaApi = async (instancePublicIP, email) => {
    const url = `http://${instancePublicIP}/api/notification/${email}`;
    const response = await axios.delete(url);
    return await response.status;
};

export const getSubscriptions = async (instancePublicIP) => {
    const url = `http://${instancePublicIP}/api/notification`;
    const response = await axios.get(url);
    return await response;
};

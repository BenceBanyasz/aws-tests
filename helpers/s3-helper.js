import AWS from "aws-sdk";
import axios from "axios";
import { fileFromPath } from "formdata-node/file-from-path";
import { getRoleName } from "./sns-sqs-helper.js";
import { getAttachedPolicies } from "./get-policies-for-role.js";

AWS.config.update({ region: "eu-central-1" });

const s3 = new AWS.S3();

export const getFqdnReponseStatus = async (url) => {
    try {
        const response = await axios.get(url);
        return response.status;
    } catch (error) {
        // If a request is made and the server responds with a status code falls out of the range of 2xx
        if (error.response) {
            return error.response.status;
        }
        // Something happened in setting up the request and triggered an Error
        else {
            console.error("Error", error.message);
        }
    }
};

const getBucketPolicy = async () => {
    const bucketName = await getInstanceBucketName();
    const policy = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
    return policy.Policy;
};

const getBucketPolicyStatement = async () => {
    const policy = await getBucketPolicy();
    const policyDocument = JSON.parse(decodeURIComponent(policy));
    return policyDocument.Statement;
};

const getBucketPolicyPrincipals = async () => {
    const statements = await getBucketPolicyStatement();
    return statements.map((statement) => statement.Principal.AWS);
};

const getBucketPolicyResources = async () => {
    const statements = await getBucketPolicyStatement();
    return statements.map((statement) => statement.Resource);
};

export const getBucketPolicyPrincipalsWithResources = async () => {
    const policyPrincipals = await getBucketPolicyPrincipals();
    const policyResources = await getBucketPolicyResources();
    return policyPrincipals.reduce((obj, key, index) => {
        obj[key] = Array.isArray(policyResources[index])
            ? policyResources[index]
            : [policyResources[index]];
        return obj;
    }, {});
};

export const listBucketNames = async () => {
    const data = await s3.listBuckets().promise();

    // Extract the bucket names
    const bucketNames = data.Buckets.map((bucket) => bucket.Name);

    return bucketNames;
};

export const getInstanceBucketName = async () => {
    const bucketNames = await listBucketNames();
    return bucketNames.find((name) =>
        /^cloudximage-imagestorebucket[\w-]+$/.test(name)
    );
};

export const getBucketTags = async () => {
    const bucketName = await getInstanceBucketName();
    const data = await s3.getBucketTagging({ Bucket: bucketName }).promise();
    return data.TagSet; // This returns an array of tags
};

export const getBucketEncryption = async () => {
    const bucketName = await getInstanceBucketName();
    const data = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
    return data.ServerSideEncryptionConfiguration.Rules[0]
        .ApplyServerSideEncryptionByDefault;
};

export const getBucketVersioning = async () => {
    const bucketName = await getInstanceBucketName();
    const data = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    return data.Status;
};

export const getBucketPublicAccessDetails = async () => {
    const bucketName = await getInstanceBucketName();
    try {
        // Check Public Access Block configuration
        const publicAccessBlock = await s3
            .getPublicAccessBlock({ Bucket: bucketName })
            .promise();
        const blockPublicAcls =
            publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls;
        const ignorePublicAcls =
            publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls;
        const blockPublicPolicy =
            publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy;
        const restrictPublicBuckets =
            publicAccessBlock.PublicAccessBlockConfiguration
                .RestrictPublicBuckets;
        return {
            blockPublicAcls,
            ignorePublicAcls,
            blockPublicPolicy,
            restrictPublicBuckets,
        };
    } catch (error) {
        console.error(
            `Failed to check public access for bucket ${bucketName}: ${error}`
        );
    }
};

export const uploadImage = async (instancePublicIP, imagePath) => {
    const url = `http://${instancePublicIP}/api/image`;
    const form = new FormData();
    form.append("upfile", await fileFromPath(imagePath));
    const response = await axios.post(url, form);
    return await response.status;
};

export const getImages = async (instancePublicIP) => {
    const url = `http://${instancePublicIP}/api/image`;
    try {
        const response = await axios.get(url);

        return response;
    } catch (error) {
        console.error("Failed to retrieve image", error.message);
    }
};

export const getImagesStatusCode = async (instancePublicIP) => {
    const images = await getImages(instancePublicIP);
    return images.status;
};

export const downloadImageStatusCode = async (instancePublicIP) => {
    const images = await getImages(instancePublicIP);
    const firstImageId = images.data[0].id;
    const url = `http://${instancePublicIP}/api/image/file/${firstImageId}`;

    try {
        const response = await axios.get(url);
        return response.status;
    } catch (error) {
        console.error(`Error fetching image:`, error.message);
    }
};

export const deleteImageStatusCode = async (instancePublicIP) => {
    const images = await getImages(instancePublicIP);
    const firstImageId = images.data[0].id;
    const url = `http://${instancePublicIP}/api/image/${firstImageId}`;

    try {
        const response = await axios.delete(url);
        return response.status;
    } catch (error) {
        console.error(`Error fetching image:`, error.message);
    }
};

export const getSpecificImage = async (instancePublicIP, imageId) => {
    const url = `http://${instancePublicIP}/api/image/${imageId}`;

    try {
        const response = await axios.get(url);
        return response;
    } catch (error) {
        console.error(`Error fetching image:`, error.message);
    }
}

export const getS3PolicyName = async (appInstanceId) => {
    const roleName = await getRoleName(appInstanceId);
    const attachedPolicies = await getAttachedPolicies(roleName);
    const sqsPolicy = attachedPolicies.find((policy) =>
        policy.PolicyName.includes("cloudxserverless-ImageStoreBucketPolicy")
    );
    return sqsPolicy.PolicyName;
};

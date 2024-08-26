import AWS from "aws-sdk";

// Set the region for AWS SDK
AWS.config.update({ region: "eu-central-1" });

// Initialize IAM service client
const iam = new AWS.IAM();

// Function to get IAM policies
export async function getIAMPolicies(policyName) {
    try {
        const { Policies } = await iam.listPolicies().promise();
        const matchedPolicy = Policies.find(
            (policy) => policy.PolicyName === policyName
        );
        if (matchedPolicy) {
            const policyVersion = await iam
                .getPolicyVersion({
                    PolicyArn: matchedPolicy.Arn,
                    VersionId: matchedPolicy.DefaultVersionId,
                })
                .promise();
            const policyDocument = JSON.parse(
                decodeURIComponent(policyVersion.PolicyVersion.Document)
            );
            return policyDocument.Statement;
        }
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

export const getPoliciesForRole = async (roleName) => {
    return await iam.listRolePolicies({ RoleName: roleName }).promise();
};

export const getRolePolicy = async (roleName, policyName) => {
    return await iam
        .getRolePolicy({
            RoleName: roleName,
            PolicyName: policyName,
        })
        .promise();
};

// Function to get allowed actions for a policy
export async function getActionsAllowedForPolicy(policyName) {
    try {
        const policyStatement = await getIAMPolicies(policyName);
        return policyStatement[0].Action;
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

// Function to get resources for a policy
export async function getResourcesForPolicy(policyName) {
    try {
        const policyStatement = await getIAMPolicies(policyName);
        return policyStatement[0].Resource;
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

// Function to get effect for a policy
export async function getEffectForPolicy(policyName) {
    try {
        const policyStatement = await getIAMPolicies(policyName);
        return policyStatement[0].Effect;
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

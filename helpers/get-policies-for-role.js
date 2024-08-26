import AWS from 'aws-sdk';

// Set the region for AWS SDK
AWS.config.update({ region: 'eu-central-1' });

// Initialize IAM service client
const iam = new AWS.IAM();

// Function to get attached policies for a role
export async function getAttachedPolicies(roleName) {
    const { AttachedPolicies } = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
    return AttachedPolicies;
}


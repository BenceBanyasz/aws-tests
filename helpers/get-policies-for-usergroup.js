import AWS from 'aws-sdk';

// Set the region for AWS SDK
AWS.config.update({ region: 'eu-central-1' });

// Initialize IAM service client
const iam = new AWS.IAM();

// Function to get attached policies for a group
export async function getAttachedGroupPolicies(groupName) {
    try {
        const { AttachedPolicies } = await iam.listAttachedGroupPolicies({ GroupName: groupName }).promise();
        return AttachedPolicies[0].PolicyName;
    } catch (error) {
        console.error('Error:', error);
    }
}

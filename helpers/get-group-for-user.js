import AWS from 'aws-sdk';

// Set the region for AWS SDK
AWS.config.update({ region: 'eu-central-1' });

// Initialize IAM service client
const iam = new AWS.IAM();

// Function to get group for a user
export async function getGroupForUser(userName) {
    try {
        const { Groups } = await iam.listGroupsForUser({ UserName: userName }).promise();
        if (Groups.length > 0) {
            return Groups[0].GroupName;
        } else {
            return null; // User is not in any group
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

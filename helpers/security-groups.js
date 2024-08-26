import AWS from "aws-sdk";

AWS.config.update({ region: 'eu-central-1' });

const ec2 = new AWS.EC2();

// Function to describe security groups of an instance
async function describeSecurityGroups(instanceId) {
    try {
        const params = {
            Filters: [
                {
                    Name: 'instance-id',
                    Values: [instanceId]
                }
            ]
        };

        const data = await ec2.describeInstances(params).promise();

        // Extract security group IDs associated with the instance
        const securityGroups = data.Reservations[0].Instances[0].SecurityGroups.map(group => group.GroupId);

        // Describe security groups to get their details
        const describeParams = {
            GroupIds: securityGroups
        };

        const describeData = await ec2.describeSecurityGroups(describeParams).promise();
        
        // Return security group details
        return describeData.SecurityGroups;
    } catch (err) {
        console.error('Error describing security groups:', err);
        throw err;
    }
}

// Function to check if a specific port is accessible from the internet
export async function isPortAccessibleFromInternet(instanceId, port) {
    try {
        const securityGroups = await describeSecurityGroups(instanceId);

        for (const group of securityGroups) {
            for (const permission of group.IpPermissions) {
                if (permission.FromPort === port && permission.ToPort === port) {
                    // Check if the port is accessible from the internet
                    for (const range of permission.IpRanges) {
                        if (range.CidrIp === '0.0.0.0/0') {
                            // Port is accessible from the internet
                            return true;
                        }
                    }
                }
            }
        }

        // If the port is not found or not accessible from the internet, return false
        return false;
    } catch (err) {
        console.error('Error:', err);
        return false;
    }
}

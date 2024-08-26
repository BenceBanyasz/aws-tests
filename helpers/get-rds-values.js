import AWS from "aws-sdk";

const ec2 = new AWS.EC2({ region: "eu-central-1" });
const rds = new AWS.RDS({ region: "eu-central-1" });

export const getDatabase = async () => {
    const dbInstancesData = await rds.describeDBInstances().promise();

    const dbInstance = dbInstancesData.DBInstances.find(
        (db) => db.DBName === "cloudximages"
    );

    return dbInstance;
};

export const isRDSInPrivateSubnet = async () => {
    const dbInstance = await getDatabase();

    // Get instance subnet group
    const dbSubnetGroup = dbInstance.DBSubnetGroup;
    const subnetIds = dbSubnetGroup.Subnets.map(
        (subnet) => subnet.SubnetIdentifier
    );

    // Check if any of the subnet is public
    for (let subnetId of subnetIds) {
        const params = {
            Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        };
        const routeTables = await ec2.describeRouteTables(params).promise();
        // If a route has a natGatewayId property it indicates that it allows outbound internet traffic from resources within the private subnet, but does not allow inbound traffic from public internet
        const hasNatGateWayId = routeTables.RouteTables.some((table) =>
            table.Routes.some((route) => route.NatGatewayId)
        );
        if (hasNatGateWayId) {
            // Subnet is "private", so RDS instance is in a subnet with natGateWayId
            return true;
        }
    }
    return false;
};

const getAppSecurityGroupId = async (instanceId) => {
    const instances = await ec2
        .describeInstances({ InstanceIds: [instanceId] })
        .promise();
    // Get the first running instance
    const instance = instances.Reservations[0].Instances[0];
    return instance.SecurityGroups[0].GroupId; // return the security group ID
};

export const isPrivateSubnetSecure = async () => {
    const dbInstance = await getDatabase();
    const securityGroupId = dbInstance.VpcSecurityGroups[0].VpcSecurityGroupId;
    const appSecurityGroupId = await getAppSecurityGroupId();

    // get the security group's inbound rules
    const securityGroups = await ec2
        .describeSecurityGroups({ GroupIds: [securityGroupId] })
        .promise();
    const securityGroup = securityGroups.SecurityGroups[0];

    for (let permission of securityGroup.IpPermissions) {
        // check if any rule allows traffic from any location
        const allowsAllTraffic = permission.IpRanges.some(
            (range) => range.CidrIp === "0.0.0.0/0"
        );

        // check that the only allowed Security Group is the application's Security Group
        const onlyAppCanAccess =
            permission.UserIdGroupPairs.length === 1 &&
            permission.UserIdGroupPairs[0].GroupId === appSecurityGroupId;

        if (allowsAllTraffic || !onlyAppCanAccess) {
            return false;
        }
    }

    return true;
};

export const isIamAuthEnabled = async () => {
    const dbInstance = await getDatabase();
    return dbInstance.IAMDatabaseAuthenticationEnabled;
};

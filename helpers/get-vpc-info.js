import AWS from "aws-sdk";

AWS.config.update({ region: "eu-central-1" });

const ec2 = new AWS.EC2();

const getVpcs = async () => {
    return await ec2.describeVpcs().promise();
};

export const getNonDefaultVpc = async () => {
    const vpcs = await getVpcs();
    return vpcs.Vpcs.find((vpc) => !vpc.IsDefault);
};

export const getSubnets = async () => {
    const nonDefaultVpc = await getNonDefaultVpc();
    const subnets = await ec2
        .describeSubnets({
            Filters: [{ Name: "vpc-id", Values: [nonDefaultVpc.VpcId] }],
        })
        .promise();
    return subnets.Subnets;
};

export const hasPublicAndPrivateSubnet = async () => {
    const subnets = await getSubnets();
    let hasPublic;
    let hasPrivate;

    for (let subnet of subnets) {
        if (subnet.MapPublicIpOnLaunch) {
            hasPublic = true;
        } else {
            hasPrivate = true;
        }
    }

    return !!hasPublic && hasPrivate;
};

export const getVpcCidrBlock = async () => {
    const nonDefaultVpc = await getNonDefaultVpc();
    return nonDefaultVpc.CidrBlock;
};

export const getTags = async () => {
    const nonDefaultVpc = await getNonDefaultVpc();
    return nonDefaultVpc.Tags;
};

const getPublicSubnetId = async () => {
    const subnets = await getSubnets();
    const publicSubnet = subnets.find((subnet) => subnet.MapPublicIpOnLaunch);
    return publicSubnet.SubnetId;
};

const getPrivateSubnetId = async () => {
    const subnets = await getSubnets();
    const privateSubnet = subnets.find((subnet) => !subnet.MapPublicIpOnLaunch);
    return privateSubnet.SubnetId;
};

const getRouteTables = async () => {
    return await ec2.describeRouteTables().promise();
};

export const getPublicSubnetGatewayIds = async () => {
    const publicSubnetId = await getPublicSubnetId();
    const routeTables = await getRouteTables();

    const publicSubnetRouteTable = routeTables.RouteTables.find(
        (table) => table.Associations[0].SubnetId === publicSubnetId
    );
    let publicSubnetIds = [];
    publicSubnetRouteTable.Routes.forEach((route) =>
        publicSubnetIds.push(route.GatewayId)
    );
    return publicSubnetIds;
};

export const getPrivateSubnetGatewayIds = async () => {
    const privateSubnetId = await getPrivateSubnetId();
    const routeTables = await getRouteTables();

    const privateSubnetRouteTable = routeTables.RouteTables.find(
        (table) => table.Associations[0].SubnetId === privateSubnetId
    );
    let privateSubnetIds = [];
    privateSubnetRouteTable.Routes.forEach((route) => {
        if (route.NatGatewayId) {
            privateSubnetIds.push(route.NatGatewayId);
        }
    });
    return privateSubnetIds;
};

const getInstanceIds = async () => {
    const data = await ec2.describeInstances().promise();

    let publicInstanceId = null;
    let privateInstanceId = null;

    for (const reservation of data.Reservations) {
        for (const instance of reservation.Instances) {
            if (instance.State.Name !== 'running') {
                continue;
            }

            if (instance.PublicIpAddress) {
                publicInstanceId = instance.InstanceId;
            } else if (!instance.PublicIpAddress) {
                privateInstanceId = instance.InstanceId;
            }
        }
    }

    return { publicInstanceId, privateInstanceId };
};

export const getPrivateGroupIds = async (privateInstanceId) => {
    const privateInstance = await ec2
        .describeInstances({ InstanceIds: [privateInstanceId] })
        .promise();
    const privateInstanceSG =
        privateInstance.Reservations[0].Instances[0].SecurityGroups;
    for (const privateSG of privateInstanceSG) {
        const sgDetails = await ec2
            .describeSecurityGroups({
                GroupIds: [privateSG.GroupId],
            })
            .promise();
        const ingressRules = sgDetails.SecurityGroups[0].IpPermissions;
        const privateGroupIds = ingressRules.map(
            (rule) => rule.UserIdGroupPairs[0].GroupId
        );
        return privateGroupIds;
    }
};

export const getPublicGroupId = async (publicInstanceId) => {
    const publicInstance = await ec2
        .describeInstances({
            InstanceIds: [publicInstanceId],
        })
        .promise();
    const publicGroupId =
        publicInstance.Reservations[0].Instances[0].SecurityGroups[0].GroupId;
    return publicGroupId;
};

export const availableFromPublicInternet = async (privateInstanceId) => {
    const instanceResult = await ec2
        .describeInstances({ InstanceIds: [privateInstanceId] })
        .promise();

    const instance = instanceResult.Reservations[0].Instances[0];

    for (const sg of instance.SecurityGroups) {
        const sgDetailResult = await ec2
            .describeSecurityGroups({ GroupIds: [sg.GroupId] })
            .promise();
        const sgDetails = sgDetailResult.SecurityGroups[0];

        for (const permission of sgDetails.IpPermissions) {
            const allowsAllTraffic = permission.IpRanges.some(
                (range) => range.CidrIp === "0.0.0.0/0"
            );
            if (allowsAllTraffic) {
                console.error(
                    `Instance ${privateInstanceId} is not private as its Security Group ${sg.GroupId} allows inbound traffic from anywhere`
                );
                return true;
            }
        }
    }

    return false;
};

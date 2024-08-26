import AWS from "aws-sdk";

AWS.config.update({ region: "eu-central-1" });

const ec2 = new AWS.EC2();

// Function to retrieve information about all EC2 instances
export const getEC2InstanceForId = async (instanceIds) => {
    try {
        const data = await ec2
            .describeInstances({ InstanceIds: instanceIds })
            .promise();
        const instances = [];
        data.Reservations.forEach((reservation) => {
            reservation.Instances.forEach((instance) => {
                const instanceInfo = {
                    instanceId: instance.InstanceId,
                    publicIpAddress: instance.PublicIpAddress,
                    privateIpAddress: instance.PrivateIpAddress,
                    instanceType: instance.InstanceType,
                    tags: instance.Tags,
                    os: instance.ImageId,
                    iamProfile: instance.IamInstanceProfile,
                };
                instances.push(instanceInfo);
            });
        });
        return instances;
    } catch (error) {
        console.error("Error fetching EC2 instances:", error);
        throw error;
    }
};

const getEC2DeviceSize = async () => {
    const volumesData = await ec2.describeVolumes().promise();
    let sizes = [];
    volumesData.Volumes.forEach((item) => {
        sizes.push(item.Size);
    });
    return sizes;
};

export const validateInstanceTypes = async () => {
    const instances = await getEC2InstanceForId();
    return instances.every((instance) => instance.instanceType === "t2.micro");
};

export const areInstancesWithCorrectTag = async () => {
    const instances = await getEC2InstanceForId();

    return instances.every((obj) => {
        // Check if 'tags' property exists and contains the specified (key, value) pair
        return obj.tags.some(
            (tag) => tag.Key === "cloudx" && tag.Value === "qa"
        );
    });
};

export const isInstanceSize8GB = async () => {
    const sizes = await getEC2DeviceSize();
    return sizes.every((size) => size === 8);
};

export const hasPublicIp = async (instanceId) => {
    const instance = await getEC2InstanceForId(instanceId);
    return instance[0].publicIpAddress ? true : false;
};

export const getRunningInstanceDetails = async () => {
    const params = {
        Filters: [
            {
                Name: "instance-state-name",
                Values: ["running"],
            },
        ],
    };
    const result = await ec2.describeInstances(params).promise();
    const instanceList = result.Reservations.flatMap(
        (reservation) => reservation.Instances
    );
    return instanceList;
};

export const areAllInstancesRunningAmazonLinux2 = async () => {
    const instances = await getRunningInstanceDetails();
    for (const instance of instances) {
        const imageId = instance.ImageId;
        const images = await ec2
            .describeImages({ ImageIds: [imageId] })
            .promise();
        const image = images.Images[0];
        const imageName = image.Name.toLowerCase();

        if (!imageName.includes("amzn2")) {
            return false;
        }
    }
    return true;
};

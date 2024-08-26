import AWS from "aws-sdk";

AWS.config.update({ region: "eu-central-1" });

const cloudWatch = new AWS.CloudWatchLogs();
const cloudTrail = new AWS.CloudTrail();

export const getLogGroups = async (
    groupName = "",
    regionValue = "eu-central-1"
) => {
    const cloudWatchFlexible = new AWS.CloudWatchLogs({ region: regionValue });
    const params = groupName ? { logGroupNamePrefix: groupName } : {};
    const logGroups = await cloudWatchFlexible
        .describeLogGroups(params)
        .promise();
    return logGroups.logGroups;
};

export const getLogStreamNames = async (
    logGroupName,
    regionValue = "eu-central-1"
) => {
    const cloudWatchFlexible = new AWS.CloudWatchLogs({ region: regionValue });
    let nextToken;
    let logStreamNames = [];

    try {
        do {
            const response = await cloudWatchFlexible
                .describeLogStreams({
                    logGroupName: logGroupName,
                    nextToken: nextToken,
                })
                .promise();

            logStreamNames = logStreamNames.concat(
                response.logStreams.map((logStream) => logStream.logStreamName)
            );

            nextToken = response.nextToken;
        } while (nextToken);

        return logStreamNames;
    } catch (err) {
        console.error(err);
    }
};

export const getCloudTrailTrails = async () => {
    try {
        const trails = await cloudTrail.describeTrails().promise();
        return trails;
    } catch (err) {
        console.error(err);
    }
};

export const getTrailDetails = async () => {
    const trails = await getCloudTrailTrails();
    const trailName = trails.trailList[0].Name;
    try {
        const trailDetails = await cloudTrail
            .getTrail({ Name: trailName })
            .promise();
        return trailDetails;
    } catch (err) {
        console.error(err);
    }
};

export const getLoggingStatus = async () => {
    const trails = await getCloudTrailTrails();
    for (const trail of trails.trailList) {
        const trailStatus = await cloudTrail
            .getTrailStatus({ Name: trail.Name })
            .promise();
        return trailStatus;
    }
};

export const getTrailTags = async () => {
    const trails = await getCloudTrailTrails();
    try {
        const trailArn = trails.trailList[0].TrailARN;
        const trailTags = await cloudTrail
            .listTags({
                ResourceIdList: [trailArn],
            })
            .promise();
        return trailTags.ResourceTagList[0].TagsList;
    } catch (err) {
        console.error(err);
    }
};

export const getLogs = async (groupName, streamName) => {
    const params = {
        logGroupName: groupName,
        logStreamName: streamName,
    };
    try {
        const data = await cloudWatch.getLogEvents(params).promise();
        return data.events;
    } catch (err) {
        console.error(err);
    }
};

export const getAllLogEvents = async (logGroupName) => {
    try {
        // Fetching the most recent log stream
        const logStreams = await cloudWatch
            .describeLogStreams({
                logGroupName,
                descending: true,
                //limit: 1,
                orderBy: "LastEventTime",
            })
            .promise();

        // Check if there's a log stream
        if (!logStreams.logStreams.length) return [];

        // Fetching the most recent log events
        const logEvents = await cloudWatch
            .getLogEvents({
                logGroupName,
                logStreamName: logStreams.logStreams[0].logStreamName,
                limit: 7,
            })
            .promise();

        // Returning the events
        return logEvents.events;
    } catch (err) {
        console.error(err);
    }
};

console.log(await getAllLogEvents('/var/log/cloudxserverless-app'));

export const sleep = async (timeInSeconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeInSeconds * 1000);
    });
};

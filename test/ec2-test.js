import { expect } from "chai";

import {
    validateInstanceTypes,
    isInstanceSize8GB,
    areInstancesWithCorrectTag,
    hasPublicIp,
    areAllInstancesRunningAmazonLinux2
} from "../helpers/get-ec2-instances.js";
import { isPortAccessibleFromInternet } from "../helpers/security-groups.js";
import data from '../../applications/cdk-outputs-cloudxinfo.json' assert { type: 'json' };

const publicInstanceId = data.cloudxinfo.PublicInstanceInstanceId6CAB84B3
const privateInstanceId = data.cloudxinfo.PrivateInstanceInstanceId9DF45017;

describe("EC2 instances should have the correct properties", () => {
    it("instances should both have t2.micro instance type", async () => {
        expect(await validateInstanceTypes()).to.be.true;
    });

    it("instances should both have instance tag cloudx: qa", async () => {
        expect(await areInstancesWithCorrectTag()).to.be.true;
    });

    it("instances both should have a root block device size of 8", async () => {
        expect(await isInstanceSize8GB()).to.be.true;
    });

    it("instances both should have Amazon Linux 2 OS", async () => {
        expect(await areAllInstancesRunningAmazonLinux2()).to.be.true;
    });

    it("public instance should have public IP adress", async () => {
        expect(await hasPublicIp([publicInstanceId])).to.be.true;
    });

    it("private instance should not have public IP adress", async () => {
        expect(await hasPublicIp([privateInstanceId])).to.be.false;
    });
});

describe("EC2 instances should have security groups configured correctly", () => {
    it("public instance should be accessible from internet by SSH on port 22", async () => {
        expect(await isPortAccessibleFromInternet(publicInstanceId, 22)).to
            .be.true;
    });

    it("public instance should be accessible from internet by HTTP on port 80", async () => {
        expect(await isPortAccessibleFromInternet(publicInstanceId, 80)).to
            .be.true;
    });
});

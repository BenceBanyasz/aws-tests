import { expect } from "chai";

import {
    getNonDefaultVpc,
    getSubnets,
    hasPublicAndPrivateSubnet,
    getVpcCidrBlock,
    getTags,
    getPublicSubnetGatewayIds,
    getPrivateSubnetGatewayIds,
    availableFromPublicInternet,
    getPrivateGroupIds,
    getPublicGroupId
} from "../helpers/get-vpc-info.js";
import data from '../../applications/cdk-outputs-cloudxinfo.json' assert { type: 'json' };

const publicInstanceId = data.cloudxinfo.PublicInstanceInstanceId6CAB84B3
const privateInstanceId = data.cloudxinfo.PrivateInstanceInstanceId9DF45017;

describe("VPC should have the correct configuration", () => {
    it("should have non-defult VPC", async () => {
        expect(await getNonDefaultVpc()).to.not.be.undefined;
    });

    it("should have 2 subnets", async () => {
        expect(await getSubnets()).to.have.lengthOf(2);
    });

    it("should have a public and private subnet", async () => {
        expect(await hasPublicAndPrivateSubnet()).to.be.true;
    });

    it("should have VPC CIDR Block: 10.0.0.0/16", async () => {
        expect(await getVpcCidrBlock()).to.equal("10.0.0.0/16");
    });

    it("should have VPC tags: cloudx:qa", async () => {
        expect(await getTags()).to.deep.include({ Key: "cloudx", Value: "qa" });
    });
});

describe("subnets and routing configuration should be correct", () => {
    it("public instance should be accessible from internet by Internet Gateway", async () => {
        const publicSubnetGatewayIds = await getPublicSubnetGatewayIds();
        expect(publicSubnetGatewayIds.some((id) => id.startsWith("igw"))).to.be
            .true;
    });

    it("only the public instance should have access to the private instance", async() => {
        const publicGroupId = await getPublicGroupId(publicInstanceId);
        const privateGroupIds = await getPrivateGroupIds(privateInstanceId);
        expect(privateGroupIds.every(id => id === publicGroupId)).to.be.true;
    });

    it("private instance should be accessible from internet via Nat Gateway", async () => {
        const privateSubnetGatewayIds = await getPrivateSubnetGatewayIds();
        expect(privateSubnetGatewayIds.some((id) => id.startsWith("nat"))).to.be
            .true;
    });

    it("private instance should not be accessible from the public internet", async() => {
        expect(await availableFromPublicInternet(privateInstanceId)).to.be.false;
    });
});

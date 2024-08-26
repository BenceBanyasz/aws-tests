import { expect } from "chai";

import {
    getDatabase,
    isRDSInPrivateSubnet,
    isPrivateSubnetSecure,
    isIamAuthEnabled,
} from "../helpers/get-rds-values.js";

describe("Application instance requirements should be correct", () => {
    it("should be deployed in the private subnet", async () => {
        expect(await isRDSInPrivateSubnet()).to.be.true;
    });

    it("should be accessible from the application public subnet", async () => {
        expect(await isPrivateSubnetSecure()).to.be.true;
    });

    it("should be accessible via an IAM role", async () => {
        expect(await isIamAuthEnabled()).to.be.true;
    });
});

describe("RDS instance requirements should be correct", () => {
    it("should have instance type: db.t3.micro", async () => {
        const instance = await getDatabase();
        expect(instance.DBInstanceClass).to.equal("db.t3.micro");
    });

    it("should not have Multi-AZ", async () => {
        const instance = await getDatabase();
        expect(instance.MultiAZ).to.be.false;
    });

    it("should have 100GB storage size", async () => {
        const instance = await getDatabase();
        expect(instance.AllocatedStorage).to.equal(100);
    });

    it("should have gp2 storage type", async () => {
        const instance = await getDatabase();
        expect(instance.StorageType).to.equal("gp2");
    });

    it("should not have encryption enabled", async () => {
        const instance = await getDatabase();
        expect(instance.StorageEncrypted).to.be.false;
    });

    it("should have instance tags: cloudx:qa", async () => {
        const instance = await getDatabase();
        expect(instance.TagList).to.deep.include({
            Key: "cloudx",
            Value: "qa",
        });
    });

    it("should have type of MySQL database", async () => {
        const instance = await getDatabase();
        expect(instance.Engine).to.equal("mysql");
    });

    it("should have database version 8.0.28", async () => {
        const instance = await getDatabase();
        expect(instance.EngineVersion).to.equal("8.0.28");
    });
});

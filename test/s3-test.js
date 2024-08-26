import { expect } from "chai";

import { getPublicSubnetGatewayIds } from "../helpers/get-vpc-info.js";
import { isPortAccessibleFromInternet } from "../helpers/security-groups.js";
import { hasPublicIp } from "../helpers/get-ec2-instances.js";
import {
    getFqdnReponseStatus,
    listBucketNames,
    getBucketTags,
    getBucketEncryption,
    getBucketVersioning,
    getBucketPublicAccessDetails,
    getBucketPolicyPrincipalsWithResources,
    uploadImage,
    getImagesStatusCode,
    downloadImageStatusCode,
    deleteImageStatusCode,
    getInstanceBucketName,
} from "../helpers/s3-helper.js";
import { getAppInstanceProperty } from "../helpers/get-app-instance-values.js";

const instanceId = getAppInstanceProperty("AppInstanceInstanceId");
const instancePublicIp = getAppInstanceProperty("AppInstancePublicIp");

describe("instance requirements should be correct", () => {
    it("instance should have public IP adress", async () => {
        expect(await hasPublicIp([instanceId])).to.be.true;
    });

    it("instance should be accessible from internet by Internet Gateway", async () => {
        const publicSubnetGatewayIds = await getPublicSubnetGatewayIds();
        expect(publicSubnetGatewayIds.some((id) => id.startsWith("igw"))).to.be
            .true;
    });

    it("instance should be accessible from internet by HTTP on port 80", async () => {
        expect(await isPortAccessibleFromInternet(instanceId, 80)).to.be.true;
    });

    it("instance should be avaiable by FQDN, it should return status code 200", async () => {
        expect(
            await getFqdnReponseStatus(`http://${instancePublicIp}/api/ui`)
        ).to.equal(200);
    });

    it("instance should be accessible from internet by SSH on port 22", async () => {
        expect(await isPortAccessibleFromInternet(instanceId, 22)).to.be.true;
    });

    it("application should have access to the S3 bucket via an IAM role", async () => {
        const bucketPolicyPrincipalsAndResources =
            await getBucketPolicyPrincipalsWithResources();
        const bucketName = await getInstanceBucketName();
        const bucketArn = "arn:aws:s3:::".concat(bucketName);
        Object.entries(bucketPolicyPrincipalsAndResources).forEach(
            ([key, values]) => {
                expect(key).to.contain("arn:aws:iam");
                values.forEach((value) => expect(value).to.contain(bucketArn));
            }
        );
    });
});

describe("S3 bucket requirement should be correct", () => {
    it("should have the correct name", async () => {
        const bucketNames = await listBucketNames();
        const hasCorrectName = bucketNames.some((name) =>
            name.match(/^cloudximage-imagestorebucket[\w-]+$/)
        );
        expect(hasCorrectName, "No buckets with correct name found").to.be.true;
    });

    it("should have the correct tags", async () => {
        expect(await getBucketTags()).to.deep.include({
            Key: "cloudx",
            Value: "qa",
        });
    });

    it("should have the correct encryption", async () => {
        expect(await getBucketEncryption()).to.deep.eql({
            SSEAlgorithm: "AES256",
        });
    });

    it("should have versioning disabled", async () => {
        expect(await getBucketVersioning()).to.be.undefined;
    });

    it("should not have public access", async () => {
        const publicAccessDetails = await getBucketPublicAccessDetails();
        for (const value of Object.values(publicAccessDetails)) {
            expect(value).to.be.true;
        }
    });
});

describe("S3 functional requirements should be correct", () => {
    it("should be able to upload an image to the S3 bucket", async () => {
        expect(await uploadImage(instancePublicIp, "./test.jpg")).to.equal(200);
    });

    it("should be able to download images from the S3 bucket", async () => {
        expect(await downloadImageStatusCode(instancePublicIp)).to.equal(200);
    });

    it("should be able to view a list of uploaded images", async () => {
        expect(await getImagesStatusCode(instancePublicIp)).to.equal(200);
    });

    it("should be able to delete an image from the S3 bucket", async () => {
        expect(await deleteImageStatusCode(instancePublicIp)).to.equal(200);
    });
});

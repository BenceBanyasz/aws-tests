import { expect } from "chai";
import {
    getActionsAllowedForPolicy,
    getResourcesForPolicy,
    getEffectForPolicy,
} from "../helpers/get-policy-documents.js";
import { getAttachedPolicies } from "../helpers/get-policies-for-role.js";
import { getAttachedGroupPolicies } from "../helpers/get-policies-for-usergroup.js";
import { getGroupForUser } from "../helpers/get-group-for-user.js";

describe("Policies should match the requriements", function () {
    context("Policies", () => {
        [
            {
                policy: "FullAccessPolicyEC2",
                acionsAllowed: "ec2:*",
                resources: "*",
                effect: "Allow",
            },
            {
                policy: "FullAccessPolicyS3",
                acionsAllowed: "s3:*",
                resources: "*",
                effect: "Allow",
            },
            {
                policy: "ReadAccessPolicyS3",
                acionsAllowed: ["s3:Describe*", "s3:Get*", "s3:List*"],
                resources: "*",
                effect: "Allow",
            },
        ].forEach((item) => {
            it(`should return Actions Allowed: ${item.acionsAllowed} for ${item.policy}`, async () => {
                expect(await getActionsAllowedForPolicy(item.policy)).to.eql(
                    item.acionsAllowed
                );
            });

            it(`should return Resources: ${item.resources} for ${item.policy}`, async () => {
                expect(await getResourcesForPolicy(item.policy)).to.eql(
                    item.resources
                );
            });

            it(`should return Effect: ${item.effect} for ${item.policy}`, async () => {
                expect(await getEffectForPolicy(item.policy)).to.eql(
                    item.effect
                );
            });
        });
    });
});

describe("Roles should have the correct Policies assigned", () => {
    context("Roles", () => {
        [
            { role: "FullAccessRoleEC2", policy: "FullAccessPolicyEC2" },
            { role: "FullAccessRoleS3", policy: "FullAccessPolicyS3" },
            { role: "ReadAccessRoleS3", policy: "ReadAccessPolicyS3" },
        ].forEach((item) => {
            it(`should return policy: ${item.policy} for role: ${item.role}`, async () => {
                const attachedPolicies = await getAttachedPolicies(item.role);
                expect(attachedPolicies[0].PolicyName).to.eql(
                    item.policy
                );
            });
        });
    });
});

describe("Groups should have the correct Policies assigned", () => {
    context("Groups", () => {
        [
            { group: "FullAccessGroupEC2", policy: "FullAccessPolicyEC2" },
            { group: "FullAccessGroupS3", policy: "FullAccessPolicyS3" },
            { group: "ReadAccessGroupS3", policy: "ReadAccessPolicyS3" },
        ].forEach((item) => {
            it(`should return policy: ${item.policy} for group: ${item.group}`, async () => {
                expect(await getAttachedGroupPolicies(item.group)).to.eql(
                    item.policy
                );
            });
        });
    });
});

describe("Users should be assigned to the correct group", () => {
    context("User", () => {
        [
            { user: "FullAccessUserEC2", group: "FullAccessGroupEC2" },
            { user: "FullAccessUserS3", group: "FullAccessGroupS3" },
            { user: "ReadAccessUserS3", group: "ReadAccessGroupS3" },
        ].forEach((item) => {
            it(`user: ${item.user} should belong to group: ${item.group}`, async () => {
                expect(await getGroupForUser(item.user)).to.eql(item.group);
            });
        });
    });
});

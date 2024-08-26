# Task 2 - IAM

## Context

You will work with a sample deployment automation application **cloudxiam**. It creates a set of IAM policies, roles and
users and user groups.

Application is to be deployed by a CDK stack in the selected AWS region (indicated in the AWS config).

## Prerequisites

[Environment configuration](../../applications/README.md)

## Sub-Tasks

### 1. Deploy the IAM application

Deploy the **cloudxiam** CDK stack: [deployment instructions](../../applications/docs/cloudxiam.md).

### 2. Deployment validation

Create a **manual/automated deployment validation** test suite that covers the following requirements:

> `CXQA-IAM-01`: 3 IAM policies are created according to the following requirements:
>
> | Policy              | Actions Allowed                       | Resources | Effect  |
> |:--------------------|:--------------------------------------|:----------|:--------|
> | FullAccessPolicyEC2 | `ec2:*`                               | All       | `Allow` |
> | FullAccessPolicyS3  | `s3:*`                                | All       | `Allow` |
> | ReadAccessPolicyS3  | `s3:Describe*`, `s3:Get*`, `s3:List*` | All       | `Allow` |

> `CXQA-IAM-02`: 3 IAM roles are created according to the following requirements:
>
> | Role              | Policies            |
> |:------------------|:--------------------|
> | FullAccessRoleEC2 | FullAccessPolicyEC2 |
> | FullAccessRoleS3  | FullAccessPolicyS3  |
> | ReadAccessRoleS3  | ReadAccessPolicyS3  |

> `CXQA-IAM-03`: 3 IAM users groups are created according to the following requirements:
>
> | Group              | Policies            |
> |:-------------------|:--------------------|
> | FullAccessGroupEC2 | FullAccessPolicyEC2 |
> | FullAccessGroupS3  | FullAccessPolicyS3  |
> | ReadAccessGroupS3  | ReadAccessPolicyS3  | 

> `CXQA-IAM-04`: 3 IAM users are created according to the following requirements:
>
> | User              | Group              |
> |:------------------|:-------------------|
> | FullAccessUserEC2 | FullAccessGroupEC2 |
> | FullAccessUserS3  | FullAccessGroupS3  |
> | ReadAccessUserS3  | ReadAccessGroupS3  |

#### Testing Tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).

### 3. Regression testing

1. Deploy version 2 of the **cloudxiam** application [deployment instructions](../../applications/docs/cloudxiam.md).
2. Execute deployment validation tests against new application version deployment.
3. Create bug/root cause report for the found regression issues.

### 4. Environment clean-up

Delete the **cloudxiam** application stack and clean up the
environment: [clean-up instructions](../../applications/docs/cloudxinfo.md).

### 5. Submit results

Upload the home task artifacts (screenshots, test cases/links to automated tests code in the git repository) to Learn
Portal and change the task status to „Needs Review”.

## IMPORTANT THINGS TO KEEP IN MIND

1. Once you create AWS Account, setup Multi-factor Authentication!
2. Do NOT share your account!
3. Do NOT commit your account Credentials to the Git repository!
4. Terminate/Remove (destroy) all created resources/services once you finish the module (or the learning for the day)!
5. Please Do NOT forget to delete NAT Gateway if you used it!
6. Do NOT keep the instances running if you don’t use it!
7. Carefully keep track of billing and working instances so you don't exceed limits!

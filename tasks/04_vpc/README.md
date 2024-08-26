# Task 4 - VPC

## Context

You will work with a sample web API application **cloudxinfo** which provides information from EC2 metadata:

Application is to be deployed by CDK stack in selected AWS region (indicated in the AWS config).

[Application deployment architecture](../../applications/docs/cloudxinfo.md)

After deployment application **Swagger OpenAPI UI Endpoint** should be available by this
URL: `http://{INSTANCE PUBLIC IP}/ui`

## Prerequisites

[Environment configuration](../../applications/README.md)

## Sub-tasks:

### 1. Deploy the info application

Deploy the **cloudxinfo** CDK stack: [deployment instructions](../../applications/docs/cloudxinfo.md).

### 2. Deployment validation

Create a manual/automated deployment validation test suite that covers the following requirements:

> `CXQA-VPC-01`: VPC configuration:
> 1. The application should be deployed in non-default VPC which has 2 subnets: public and private.
> 2. VPC CIDR Block: `10.0.0.0/16`
> 3. VPC tags: `cloudx: qa`

> `CXQA-VPC-02`: Subnets and routing configuration:
> 1. The public instance should be accessible from the internet by Internet Gateway.
> 2. The public instance should have access to the private instance.
> 3. The private instance should have access to the internet via NAT Gateway.
> 4. The private instance should not be accessible from the public internet.

#### Testing Tools:

* AWS Console
* AWS SDK (for automated tests).
* Application OpenAPI documentation
* Postman
* CURL command
* SSH client

Execute test cases and verify that requirements are met.

### 3. Regression testing

1. Deploy **version 3** of **cloudxinfo** application [deployment instructions](../../applications/docs/cloudxinfo.md).
2. Execute deployment and functional validation test suites against new application version deployment.
3. Create bug/root cause report for the found regression issues.

### 4. Environment clean-up

Delete the **cloudxinfo** application stack and clean up the
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

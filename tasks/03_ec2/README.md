# Task 3 - EC2

## Context

You will work with a sample web API application **cloudxinfo** which provides information from EC2 metadata.

Application is to be deployed by a CDK stack in the selected AWS region (indicated in the AWS config).

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

> `CXQA-EC2-01`: 2 application instances should be deployed: `public` and `private`

> `CXQA-EC2-02`: Each EC2 instance should have the following configuration:
> 1. Instance type: `t2.micro`
> 2. Instance tags: `cloudx: qa`
> 3. Root block device size: 8 GB
> 4. Instance OS: Amazon Linux 2
> 5. The public instance should have public IP assigned
> 6. The private instance should not have public IP assigned

> `CXQA-EC2-03`: The security groups' configuration:
> 1. The public instance should be accessible from the internet by SSH (port 22) and HTTP (port 80) only
> 2. The private instance should be accessible only from the public instance by SSH and HTTP protocols only
> 3. Both private and public instances should have access to the internet

#### Testing Tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

### 3. Application functional validation

Create a manual/automated test suite that covers the following requirements, both for public and private instances.

> `CXQA-EC2-04`: Application API endpoint should respond with the correct instance information from EC2 metadata:
> 1. aws region
> 2. availability zone
> 3. instance private IP

#### Testing Tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

Execute test cases and verify that requirements are met.

### 4. Regression testing

1. Deploy **version 2** of the **cloudxinfo**
   application [deployment instructions](../../applications/docs/cloudxinfo.md).
2. Execute deployment and functional validation test suites against new application version deployment.
3. Create bug/root cause report for the found regression issues.

### 5. Environment clean-up

Delete the **cloudxinfo** application stack and clean up the
environment: [clean-up instructions](../../applications/docs/cloudxinfo.md).

### 6. Submit results

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

# Task 5 - S3

## Context

You will work with a sample web API **cloudximage** application that allows users to manage images in an S3 bucket.

Application is to be deployed by CDK stack in selected AWS region (indicated in the AWS config).

[Application deployment architecture](../../applications/docs/cloudximage.md)

After deployment application **Swagger OpenAPI UI Endpoint** should be available by this
URL: `http://{INSTANCE PUBLIC IP}/api/ui`

## Prerequisites

[Environment configuration](../../applications/README.md)

## Sub-tasks:

### 1. Deploy the image application

Deploy the **cloudximage** CDK stack: [deployment instructions](../../applications/docs/cloudximage.md).

### 2. Deployment Validation:

Create a manual/automated deployment validation test suite that covers the following requirements:

> `CXQA-S3-01`: Instance requirement:
> 1. The application is deployed in the public subnet and should be accessible by HTTP from the internet via an Internet
     gateway by public IP address and FQDN.
> 2. The application instance should be accessible by SSH protocol.
> 3. The application should have access to the S3 bucket via an IAM role.

> `CXQA-S3-02`: S3 bucket requirements:
> 1. Name: `cloudximage-imagestorebucket{unique id}`
> 2. Tags: `cloudx: qa`
> 3. Encryption type: SSE-S3
> 4. Versioning: disabled
> 5. Public access: no

#### Testing tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

Execute test cases and verify that requirements are met.

### 3. Application functional validation

Create a manual/automated test suite that covers the following application API functions:

> `CXQA-S3-03`: Upload images to the S3 bucket

> `CXQA-S3-04`: Download images from the S3 bucket

> `CXQA-S3-05`: View a list of uploaded images

> `CXQA-S3-06`: Delete an image from the S3 bucket

#### Testing tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

Execute test cases and verify that requirements are met.

### 4. Regression testing

1. Deploy **version 2** of **cloudximage** application [deployment instructions](../../applications/docs/cloudximage.md).
2. Execute deployment and functional validation test suites against new application version deployment.
3. Create bug/root cause report for the found regression issues.

### 5. Environment clean-up

Delete the application stack and clean up the
environment: [clean-up instructions](../../applications/docs/cloudximage.md).

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


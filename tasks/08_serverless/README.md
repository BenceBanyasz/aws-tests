# Task 8 - Serverless Basics

## Context

The new version of the **cloudximage** application - called **cloudxserverless** - is available!

This **Serveless Image** application now uses more serverless AWS services:

* AWS Lambda
* Dynamo DB
* AWS SQS
* AWS SNS

Application is to be deployed by CDK stack in selected AWS region (indicated in the AWS config).

[Application deployment architecture](../../applications/docs/cloudxserverless.md)

After deployment application **Swagger OpenAPI UI Endpoint** should be available by this
URL: `http://{INSTANCE PUBLIC IP}/api/ui`

## Prerequisites

[Environment configuration](../../applications/README.md)

## Sub-tasks:

### 1. Deploy the serverless image application

Deploy the **cloudxserverless** CDK stack: [deployment instructions](../../applications/docs/cloudxserverless.md).

### 2. Deployment validation

Create a manual/automated deployment validation test suite that covers the following requirements:

> `CXQA-SLESS-01`: The application database is replaced with a DynamoDB table.
>
> DynamoDB Table requirements:
> * Name: `cloudxserverless-DatabaseImagesTable{unique id}`
> * Global secondary indexes: not enabled
> * Provisioned read capacity units: 5 (autoscaling for reads: Off)
> * Provisioned write capacity units: 5 (autoscaling for writes: On, 1-5 units)
> * Time to Live: disabled
> * Tags: `cloudx: qa`

> `CXQA-SLESS-02`: The DynamoDB table should store the following image metadata information:
> 1. object creation-time
> 2. object last modification date-time
> 3. object key
> 4. object size
> 5. object type.
>
> Key/property names might be different.

> `CXQA-SLESS-03`: The SNS topic is used to subscribe, unsubscribe users, list existing subscriptions, and send messages
> to subscribers about upload and delete image events.

> `CXQA-SLESS-04`: The application uses an SQS queue to publish event messages.

> `CXQA-SLESS-05`: A lambda function is subscribed to the SQS queue to filter and put event messages to the SNS topic.

> `CXQA-SLESS-06`: The application should have access to the S3 bucket, the DynamoDB table, the SQS queue and the SNS
> topic instance via
> IAM roles.

> `CXQA-SLESS-07`: AWS Lambda requirements:
> * Lambda Trigger: SQS Queue
> * Lambda application logs are stored in CloudWatch log
    group (`aws/lambda/cloudxserverless-EventHandlerLambda{unique id}`)
> * Memory: 128 MB
> * Ephemeral storage: 512 MB
> * Timeout: 3 sec.
> * Tags: `cloudx: qa`

#### Testing Tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client
* DynamoDB client

### 3. Application regression testing

1. Adjust the functional test cases developed in modules 6 and 7 to the new application architecture.
2. Execute the functional test cases developed in modules 6 and 7 and verify that there are no functional regression
   issues.
3. Deploy **version 2** of the **CloudXServerless**
   application [deployment instructions](../../applications/docs/cloudxserverless.md).
4. Execute deployment and functional validation test suites against new application version deployment.
5. Create bug/root cause report for the found regression issues.

#### Testing Tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client
* AWS SDK (for automated tests).
* Dynamo DB client

### 4. Environment clean-up

Delete the application stack and clean up the
environment: [clean-up instructions](../../applications/docs/cloudxserverless.md).

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

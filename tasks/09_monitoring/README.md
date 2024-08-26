# Task 9 - Monitoring and logging

## Context

You will work with a sample web API **cloudxserverless** application that allows users to manage images in an S3 bucket.

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

> `CXQA-MON-01`: The application EC2 instance has CloudWatch integration.

> `CXQA-MON-02`: CloudInit logs should be collected in CloudWatch logs.
> 1. LogGroup `/var/log/cloud-init`: for the cloud-init logs of the EC2 instance (by instance ID), in the us-east-1
     region

> `CXQA-MON-03`: The application messages should be collected in CloudWatch logs.
> 1. LogGroup `/var/log/cloudxserverless-app`: for the application deployed on the EC2 instance (by instance ID), in the
     same region
     as the stack0

> `CXQA-MON-04`: The event handler logs should be collected in CloudWatch logs.
> 1. LogGroup `/aws/lambda/cloudxserverless-EventHandlerLambda{unique id}`: for the event handler lambda function, in
     the same
     region as the stack

> `CXQA-MON-05`: CloudTrail is enabled for Serverless stack and collects logs about AWS services access.
>
> CloudTrail trail requirements:
> 1. Name: `cloudxserverless-Trail{unique id}`
> 2. Multi-region: yes
> 3. Log file validation: enabled
> 4. SSE-KMS encryption: not enabled
> 5. Tags: `cloudx: qa`

#### Testing Tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

### 3. Monitoring and logging validation

Create an additional test suite that covers the following requirements related to application monitoring and logging:

> `CXQA-MON-06`: `Cloudxserverless-EventHandlerLambda{unique_id}` log group:
> 1. Each notification event processed by Event Handler Lambda is logged in the CloudWatch logs.
> 2. For each notification, the image information (object key, object type, object size, modification date, download
     link) is logged in the Event Handler Lambda logs in CloudWatch logs.

> `CXQA-MON-07`: `Cloudxserverless-app` log group:
> 1. All HTTP API requests processed by the application are logged in the CloudWatch logs.

#### Testing Tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client
* AWS SDK (for automated tests).

### 4. Application regression testing

1. Deploy **version 3** of the **CloudXServerless**
   application [deployment instructions](../../applications/docs/cloudxserverless.md).
2. Execute deployment and functional validation test suites against new application version deployment.
3. Create bug/root cause report for the found regression issues.

### 5. Environment clean-up

Delete the application stack and clean up the
environment: [clean-up instructions](../../applications/docs/cloudxserverless.md).

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

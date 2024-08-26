# Task 7 - SNS, SQS

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

### 2. Deployment validation

Create a manual/automated deployment validation test suite that covers the following requirements:

> `CXQA-SNSSQS-01`: Application Instance requirements
> 1. The application uses an SNS topic to subscribe and unsubscribe users, list existing subscriptions, and send e-mail
     messages to subscribers about upload and delete image events, in a readable format (not JSON).
> 2. The application uses an SQS queue to publish event messages.
> 3. The application should have access to the SQS queue and the SNS topic via IAM roles.

> `CXQA-SNSSQS-02`: SNS topic requirements:
> 1. Name: `cloudximage-TopicSNSTopic{unique id}`
> 2. Type: standard
> 3. Encryption: disabled
> 4. Tags: `cloudx: qa`

> `CXQA-SNSSQS-03`: SQS queue requirements:
> 1. Name: `cloudximage-QueueSQSQueue{unique id}`
> 2. Encryption: enabled
> 3. Type: standard
> 4. Tags: `cloudx: qa`
> 5. Dead-letter queue: no

#### Testing Tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client

### 3. Application functional validation

Create a manual/automated functional test suite that covers the following requirements:

> `CXQA-SNSSQS-04`: The user can subscribe to notifications about application events via a provided email address

> `CXQA-SNSSQS-05`: The user has to confirm the subscription after receiving the confirmation email

> `CXQA-SNSSQS-06`: The subscribed user receives notifications about images events (image is uploaded, image is deleted)

> `CXQA-SNSSQS-07`: The notification contains the correct image metadata information and a download link

> `CXQA-SNSSQS-08`: The user can download the image using the download link from the notification

> `CXQA-SNSSQS-09`: The user can unsubscribe from the notifications

> `CXQA-SNSSQS-10`: The unsubscribed user does not receive further notifications

> `CXQA-SNSSQS-11`: It is possible to view all existing subscriptions using `http://{INSTANCE PUBLIC IP}/api/notification`
> GET API call

Execute test cases and verify that requirements are met.

#### Testing Tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client
* AWS SDK (for automated tests).

#### Hints for test automation

1. Subscription confirmation can be done using AWS SDK SNS client
2. Emails can be received using email client libraries available for particular programming language

### 4. Regression testing

1. Deploy **version 4** of the **CloudXImage**
   application [deployment instructions](../../applications/docs/cloudximage.md).
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

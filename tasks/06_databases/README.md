# Task 6 - RDS

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

> `CXQA-RDS-01`: Application Instance requirements:
> 1. The application database (MySQL RDS instance) is deployed in the private subnet and should be accessible only from
     the application's public subnet, but not from the public internet.
> 2. The application can access to MySQL RDS via an Security Group.

> `CXQA-RDS-02`: RDS Instance requirements:
> 1. Instance type: `db.t3.micro`
> 2. Multi-AZ: no
> 3. Storage size: 100 GiB
> 4. Storage type: General Purpose SSD (gp2)
> 5. Encryption: not enabled
> 6. Instance tags: `cloudx: qa`
> 7. Database type: MySQL
> 8. Database version: 8.0.32

#### Testing tools:

* AWS Console
* AWS CLI
* AWS SDK (for automated tests).
* Application Swagger OpenAPI documentation
* SSH client
* MySQL database client
* Infrastructure testing libraries (e.g. TestInfra)

Execute test cases and verify that requirements are met.

### 3. Application functional validation

Create a manual/automated deployment validation test suite that covers the following requirements:

> `CXQA-RDS-03`: The uploaded image metadata is stored in MySQL RDS database:
> 1. image key
> 2. image size
> 3. image type
> 4. last modification date and time
>
> Key/property names might be different.

> `CXQA-RDS-04`: The image metadata is returned by `http://{INSTANCE PUBLIC IP}/api/image/{image_id}` GET request

> `CXQA-RDS-05`: The image metadata for the deleted image is also deleted from the database

#### Testing tools:

* Application Swagger OpenAPI documentation
* Postman / CURL
* SSH client
* MySQL database client (NB: database is accessible only from application instance, not from the internet)

Execute test cases and verify that requirements are met.

### 4. Regression testing

1. Deploy **version 3** of the **cloudximage**
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

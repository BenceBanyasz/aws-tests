# Task 1 – Account creation, roles, billing, alerting

## Sub-tasks

### 1. Create AWS Account

First, follow this [link](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/) to create your account. Note, accounts are usually activated within a few minutes, but the process might take up to 24 hours.

Then, as you should **not use the root user**, create an admin user that should be used during this course by following this [guide](https://cdkworkshop.com/15-prerequisites/200-account.html) (name the user `cloudx` or anything you like). You will need this user to be set up when performing [setup](../../applications/README.md).

### 2. Secure account

Follow general AWS recommendations.

Here mentioned some of them, but feel free to read the full article ([best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)):

* Lock away your AWS account root user access keys ([reference](https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started_create-admin-group.html))
* Avoid using the AWS account root user
* Grant least privilege
* Use permissions with the AWS-managed policies
* Configure a strong password policy for your users
* Enable MFA

### 3. Set Budgets/Alerts

Avoid surprising charges, so control the cost carefully:

* Ensure free tier notifications are enabled ([link](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html))
* Set up budget reached notifications (ex. 40%, 80%, 100%) manually (via console). The alert should be sent to your email.

## IMPORTANT THINGS TO KEEP IN MIND

1. Once you create AWS Account, setup Multi-factor Authentication!
2. Do NOT share your account!
3. Do NOT commit your account Credentials to the Git repository!
4. Terminate/Remove (destroy) all created resources/services once you finish the module (or the learning for the day)!
5. Please Do NOT forget to delete NAT Gateway if you used it!
6. Do NOT keep the instances running if you don’t use it!
7. Carefully keep track of billing and working instances so you don't exceed limits!

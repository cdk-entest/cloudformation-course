---
author: haimtran
title: getting started with cdk
description: use cdk to build some simple architects
publishedDate: 08/08/2023
---

## Introduction

The CDK (Cloud Development Kit) lets you build infrastructure on AWS using programming langugages such as TypesScript, JavaScript, Python, Java, C#/.Net, and Go. This note helps you quickly getting started with CDK through building some simple architects.

- Setup environment
- Hello CDK
- Lambda Stack
- VPC Stack

## Setup Environment

First we need to run cdk bootstrap which provision some required resources in a specified region. This is required before we can deploy any stack in a region.

```bash
cdk bootstrap aws://AWS_ACCOUNT_ID/REGION
```

Second, we need to install TypeScript

```bash
npm install -g typescript
```

Third, We can refere to cdk environment [variables](https://docs.aws.amazon.com/cdk/v2/guide/environments.html) in our stack code as below

```js
new MyDevStack(app, "dev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

and we can provide/define them for a stack as well.

```js
new MyDevStack(app, "dev", {
  env: {
    account: "MY_ACCOUNT_ID",
    region: "REGION",
  },
});
```

## Hello CDK

Let init a new CDK project in TypeScript

```bash
mkdir hello-cdk
cd hello-cdk
cdk init --language typescript
```

A new project is created with structure as below

```
|--build
   |--hello-cdk.ts
|--lib
   |--hello-cdk-stack.ts
|--test
   |--hello-cdk.test.ts
|--cdk.out
   |--HelloCdkStack.template.json
|--node_modules
|--cdk.json
|--package.json
|--package-lock.json
|--tsconfig.json
```

An application should be declared in hello-cdk.ts

```ts

```

The application can consists of multiple stacks which should be located in the lib directory. To synthesize CloudFormation templates from TypeScript, we run the following command from the root directory of the project

```bash
cdk synth
```

The synthesized CloudFormation templates are stored in cdk.out such as HelloCdkStack.template.json

## Lambda Stack

Let create a stack to deploy a Lambda function

```ts
import { Construct } from "constructs";
import { Duration, Stack, StackProps, aws_iam, aws_lambda } from "aws-cdk-lib";
import * as path from "path";

export class HelloCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const role = new aws_iam.Role(this, "ExecutionRoleForHelloLambda", {
      roleName: "ExecutionRoleForHelloLambda",
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const fn = new aws_lambda.Function(this, "HelloLambdaFunction", {
      functionName: "HelloLambdaFunction",
      code: aws_lambda.Code.fromAsset(path.join(__dirname, "./../lambda")),
      handler: "index.handler",
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      timeout: Duration.seconds(10),
      memorySize: 512,
      role: role,
      environment: {
        TABLE_NAME: "MessageTable",
      },
    });
  }
}
```

Now let deploy the stack by running the following command. By running this command, the HelloCdkLambdaStack is synthesized into a CloudFormation template, then is deployed to CloudFormation servcie.

```bash
cdk deploy
```

To verify the deployed stack, go to CloudFormation service in aws console and we can see the HelloCdkStack. Then we can go to the Lambda service and test the deployed HelloLambdaFunction.

## VPC Stack

Let create a stack to deploy a VPC and a webserver

```ts

```

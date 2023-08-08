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

Let create a basic VPC stack with a CIDR params which can be passed as a prop.

```ts
interface VpcProps extends StackProps {
  cidr: string;
}
```

Here is the simple VPC stack with only one public subnet. Please note that since we are using the level 2 VPC stack, a internet gateway and a route table are automatically are created and attached to the VPC.

```ts
export class VpcStack extends Stack {
  public readonly vpc: aws_ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);

    this.vpc = new aws_ec2.Vpc(this, "VpcAlbDemo", {
      vpcName: "VpcAlbDemo",
      cidr: props.cidr,
      // max number of az
      maxAzs: 1,
      // enable dns
      enableDnsHostnames: true,
      // enable dns
      enableDnsSupport: true,
      // aws nat gateway service not instance
      natGatewayProvider: aws_ec2.NatInstanceProvider.gateway(),
      // can be less than num az default 1 natgw/zone
      natGateways: 1,
      // subnet configuration per zone
      subnetConfiguration: [
        {
          name: "Public",
          cidrMask: 24,
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
      ],
    });
  }
}
```

Next, let create an application stack which is a webserver with userdata to run a simple web (Fask) application. Since the EC2 located in the public subnet and attached an AmazonSSMManagedInstanceCore, then later on we can connect to the EC2 via system manager service.

```ts
export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    const role = new aws_iam.Role(this, "RoleForWebServer", {
      roleName: "RoleForWebServer",
      assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // allow ssm connection
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonSSMManagedInstanceCore"
      )
    );

    // security group for webserver
    const sg = new aws_ec2.SecurityGroup(this, "WebServerPollySecurityGroup", {
      vpc: props.vpc,
      securityGroupName: "WebServerPollySecurityGroup",
    });

    sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(80));

    // webserver with userdata
    const ec2 = new aws_ec2.Instance(this, "WebServerDemo", {
      instanceName: "WebServerDemo",
      role: role,
      vpc: props.vpc,
      securityGroup: sg,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
      instanceType: aws_ec2.InstanceType.of(
        aws_ec2.InstanceClass.T2,
        aws_ec2.InstanceSize.SMALL
      ),
      machineImage: new aws_ec2.AmazonLinuxImage({
        generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition: aws_ec2.AmazonLinuxEdition.STANDARD,
      }),
    });

    ec2.addUserData(fs.readFileSync("data/user-data.sh", "utf8"));
  }
}
```

Finally, we need to update the App to include both the VPCStack and the ApplicationStack. As the application can be deployed only after the vpc avaiable, therefore, we need to add a depedency between webserver and vpc.

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HelloCdkStack } from "../lib/hello-cdk-stack";
import { ApplicationStack, VpcStack } from "../lib/vpc-stack";

const app = new cdk.App();

// lambda stack
new HelloCdkStack(app, "HelloCdkStack", {});

// vpc stack
const vpc = new VpcStack(app, "VpcStack", {
  cidr: "10.0.0.0/24",
});

// application stack - webserver
const webserver = new ApplicationStack(app, "ApplicationStack", {
  vpc: vpc.vpc,
});

// dependen between stacks
webserver.addDependency(vpc);
```

Now let deploy all stacks by running the following command

```bash
cdk deploy --all
```

## Clean Resources

Run the below command to destroy all deployed stacks

```bash
cdk destroy --all
```

import { Construct } from "constructs";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as aws_lambda from 'aws-cdk-lib/aws-lambda';
import * as aws_iam from 'aws-cdk-lib/aws-iam'
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
      handler: "index.py",
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

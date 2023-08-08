import { Stack, StackProps } from "aws-cdk-lib";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2"
import * as aws_iam from 'aws-cdk-lib/aws-iam'
import { Construct } from "constructs";
import * as fs from "fs";

interface VpcProps extends StackProps {
  cidr: string;
}

interface ApplicationProps extends StackProps {
  vpc: aws_ec2.IVpc;
}

export class VpcStack extends Stack {
  public readonly vpc: aws_ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);

    this.vpc = new aws_ec2.Vpc(this, "VpcDemo", {
      vpcName: "VpcDemo",
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
    const sg = new aws_ec2.SecurityGroup(this, "SecurityGroupForWebServer", {
      vpc: props.vpc,
      securityGroupName: "SecurityGroupForWebServer",
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

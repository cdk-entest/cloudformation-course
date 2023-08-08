---
author: haimtran
title: getting started with cloudformation
description: use cloudformation to build a simple vpc and ec2
publishedDate: 08/08/2023
---

## Introduction

This note shows how to get started with CloudFormation by building a very basic architecture.

- Architecture
- Write the CloudFormation template
- Deploy and destroy the template

## Architecture

The architecture is very simple whhich consist of a VPC, a public subnet and a EC2 instance as below diagram

![vpc](https://github.com/cdk-entest/cloudformation-course/assets/20411077/2b6d4e96-76f6-49e5-8f34-a0d2b019fb81)


## CloudFormation

A basic CloudFormation template consists of the following components

- template version
- description
- parameters
- mappings
- resources

For example, below is a simple template without a resource yet. Currently, the only version is "2010-09-09". The parameters sesction allow developers to pass arguments at the _run time_ ( at the time we deploy the template). The mapping defines a set of available for variables, for example, an instance type could be either t2.small or t2.medium. This is similar to _enum_ in programming.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: create an EC2 within a VPC and access via SSM
Parameters:
  InstanceType:
    Description: WebServer EC2 instance type
    Type: String
    Default: t2.small
    AllowedValues:
      - t2.small
      - t2.medium
    ConstraintDescription: must be a valid EC2 instance type.
Mappings:
  AWSInstanceType2Arch:
    t2.small:
      Arch: HVM64
    t2.medium:
      Arch: HVM64
  AWSRegionArch2AMI:
    ap-southeast-1:
      HVM64: ami-0ba35dc9caf73d1c7
      HVMG2: ami-0e46ce0d6a87dc979
Resources:
```

The resources can consits of multiple resource such as VPC, Security Group, EC2 instances. Dependinng on architectures, it is a good practice to break down a template (a yaml file) in to modules or multiple yaml file.

For this simple example, let create a VPC with some basic components

- VPC with CIDR 10.0.0.0/16
- An Interget Gateway
- A Route Table
- A Security Group opening port 80 and 22 from 0/0

```yaml
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    Tags:
      - Key: Application
        Value:
          Ref: AWS::StackId
Subnet:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId:
      Ref: VPC
    CidrBlock: 10.0.0.0/24
    Tags:
      - Key: Application
        Value:
          Ref: AWS::StackId
InternetGateway:
  Type: AWS::EC2::InternetGateway
  Properties:
    Tags:
      - Key: Application
        Value:
          Ref: AWS::StackId
AttachGateway:
  Type: AWS::EC2::VPCGatewayAttachment
  Properties:
    VpcId:
      Ref: VPC
    InternetGatewayId:
      Ref: InternetGateway
RouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId:
      Ref: VPC
    Tags:
      - Key: Application
        Value:
          Ref: AWS::StackId
Route:
  Type: AWS::EC2::Route
  DependsOn: AttachGateway
  Properties:
    RouteTableId:
      Ref: RouteTable
    DestinationCidrBlock: 0.0.0.0/0
    GatewayId:
      Ref: InternetGateway
SubnetRouteTableAssociation:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId:
      Ref: Subnet
    RouteTableId:
      Ref: RouteTable
InstanceSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    VpcId:
      Ref: VPC
    GroupDescription: Enable SSH access via port 22
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: "80"
        ToPort: "80"
        CidrIp: 0.0.0.0/0
```

Then create an IAM role and an instance profile for the webserver

```yaml
RoleForEC2:
  Type: AWS::IAM::Role
  Properties:
    RoleName: RoleForEC2
    AssumeRolePolicyDocument:
      Version: 2012-10-17
      Statement:
        - Action:
            - sts:AssumeRole
          Effect: Allow
          Principal:
            Service:
              - ec2.amazonaws.com
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM
InstanceProfile:
  Type: AWS::IAM::InstanceProfile
  Properties:
    Roles:
      - !Ref RoleForEC2
```

Finally, create an EC2 instance for the webserver

```yaml
  Type: AWS::EC2::Instance
    DependsOn: AttachGateway
    Properties:
      ImageId:
        Fn::FindInMap:
          - AWSRegionArch2AMI
          - Ref: AWS::Region
          - Fn::FindInMap:
              - AWSInstanceType2Arch
              - Ref: InstanceType
              - Arch
      InstanceType:
        Ref: InstanceType
      IamInstanceProfile: !Ref InstanceProfile
      NetworkInterfaces:
        - DeviceIndex: "0"
          AssociatePublicIpAddress: "true"
          SubnetId:
            Ref: Subnet
          GroupSet:
            - !Ref InstanceSecurityGroup
```

## Deploy and Destroy

There are different ways to deploy the template (yaml file). For example, we can deploy it from terminal using [aws cli], or from aws console. Please make sure that the terminal has permission to deploy this template.

```bash
aws cloudformation create-stack \
 --stack-name cfn-vpc-demo \
 --template-body file://vpc.yaml \
 --parameters ParameterKey=InstanceType,ParameterValue=t2.medium \
 --capabilities CAPABILITY_NAMED_IAM
```

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { HelloCdkStack } from '../lib/hello-cdk-stack';
import { ApplicationStack, VpcStack } from '../lib/vpc-stack';

const app = new cdk.App();

// lambda stack 
new HelloCdkStack(app, 'HelloCdkStack', {});

// vpc stack  
const vpc = new VpcStack(app, "VpcStack", {
    cidr: "10.0.0.0/24"
})

// application stack - webserver  
const webserver = new ApplicationStack(app, "ApplicationStack", {
    vpc: vpc.vpc
})

// dependen between stacks 
webserver.addDependency(vpc) 
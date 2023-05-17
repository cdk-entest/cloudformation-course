aws cloudformation create-stack \
 --stack-name cfn-vpc-demo \
 --template-body file://vpc.yaml \
 --parameters ParameterKey=InstanceType,ParameterValue=t2.medium \
 --capabilities CAPABILITY_NAMED_IAM

#  aws cloudformation delete-stack \
#  --stack-name cfn-vpc-demo 
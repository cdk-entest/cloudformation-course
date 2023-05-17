aws cloudformation create-stack \
 --stack-name cfn-lambda-demo \
 --template-body file://lambda_template.yaml \
 --capabilities CAPABILITY_NAMED_IAM

#  aws cloudformation create-stack \
#  --stack-name cfn-lambda-demo \
#  --template-body file://lambda_template.yaml \
#  --capabilities CAPABILITY_NAMED_IAM \
#  --role-arn arn:aws:iam::610770234379:role/cdk-admin-role-CdkAdminRole-1IBORD9375GQF


# aws cloudformation delete-stack \
#  --stack-name cfn-lambda-demo
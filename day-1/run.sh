aws cloudformation create-stack \
 --stack-name cfn-lambda-demo \
 --template-body file://lambda.yaml \
 --capabilities CAPABILITY_NAMED_IAM

# aws cloudformation delete-stack \
#  --stack-name cfn-lambda-demo
import os

def handler(event, context):
    """
    lambda handler
    """
    print("Hello Lambda {0}".format(os.environ["TABLE_NAME"]))


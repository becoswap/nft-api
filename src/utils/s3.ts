import AWS from "aws-sdk"

const s3 = new AWS.S3({
  accessKeyId: 'AKIAWCKLJSTF4WWBH7W5',
  secretAccessKey: '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',
  region: 'us-east-2'
});

export default s3;
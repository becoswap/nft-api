import s3 from '../../utils/s3';
import crypto from 'crypto';

const ALLOW_SUFFIX = ['png', 'jpg', 'gif', 'mp3', 'mp4'];

const signature = ctx => {
  const body = ctx.request.body;
  if (!ALLOW_SUFFIX.includes(body.suffix)) {
    ctx.status = 400;
    ctx.message = 'invalid suffix';
    return;
  }

  const id = crypto.randomBytes(16).toString('hex');
  const key = 'static/ntfs/' + id + '.' + body.suffix;
  const url = s3.createPresignedPost({
    Bucket: 'becoswap',
    Expires: 300,
    Conditions: [['content-length-range', 0, 104857600]],

    Fields: {
      key: key,
    },
  });

  ctx.status = 200;
  ctx.body = {
    ...url,
    fileUrl: 'https://d3g5bzmawnfi61.cloudfront.net/' + key,
  };
};

export default {
  signature,
};

import database from '../../database';
import { buildQuery } from '../../utils/query';
import { verify } from '../../utils/verify';

const User = database.models.user;

const EXPIRE_DUATION = 120;

async function list(ctx) {
  const query = buildQuery(ctx, [], ['updatedAt']);
  const nfts = await User.findAndCountAll(query);
  ctx.status = 200;
  ctx.body = nfts;
}

async function createOrUpdate(ctx) {
  let body = ctx.request.body;
  const timestamp = Math.floor(Date.now() / 1000);

  if (body.timestamp + EXPIRE_DUATION < timestamp) {
    ctx.status = 400;
    ctx.message = 'signature expired';
    return;
  }

  const msg = [
    "Becoswap:updateUser",
    body.name,
    String(body.timestamp)
  ]
  const ok = await verify(body.id, msg.join(":"), body.sign)
  if (!ok) {
    ctx.status = 400;
    ctx.message = 'invalid signature';
    return;
  }

  delete body.timestamp;
  delete body.sign;

  let user = await User.findByPk(body.id);
  if (!user) {
    user = await User.create(body);
  } else {
    user.setAttributes(body);
    await user.save();
  }
  ctx.body = user;
}


export default {
  list,
  createOrUpdate,
}
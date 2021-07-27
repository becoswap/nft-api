import database from '../../database';
import { buildQuery } from '../../utils/query';

const Event = database.models.event;

async function list(ctx) {
  const query = buildQuery(ctx, ['nftAddress', 'nftId'], ['createdAt']);
  const nfts = await Event.findAndCountAll(query);
  ctx.status = 200;
  ctx.body = nfts;
}

export default {
  list,
};

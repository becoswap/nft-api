import database from '../../database';
import { buildQuery } from '../../utils/query';

const Vote = database.models.vote;

async function list(ctx) {
  const query = buildQuery(ctx, Vote);
  const votes = await Vote.findAndCountAll(query);
  ctx.status = 200;
  ctx.body = votes;
}

export default {
  list,
};

import database from '../../database';
import { buildQuery } from '../../utils/query';

const Collection = database.models.collection;

async function get(ctx) {
  const col = await Collection.findByPk(ctx.params.id);
  if (!col) {
    ctx.status = 404;
    ctx.message = 'Collection not found';
    return;
  }
  ctx.body = col;
}

async function list(ctx) {
  const query = buildQuery(ctx, Collection);
  const cols = await Collection.findAndCountAll({
    ...query,
  });
  ctx.status = 200;
  ctx.body = cols;
}

export default {
  get,
  list,
};

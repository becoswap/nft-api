import database from '../../database';

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

export default {
  get,
};

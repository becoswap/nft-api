import sequelize from '../../database';
import { getPropertyStats } from '../../elastic';
const Collection = sequelize.models.collection;

async function stats(ctx) {
  const collection = await Collection.findByPk(ctx.query.nftType);

  if (!collection) {
    ctx.status = 400;
    ctx.body = {
      message: 'Collection not found',
    };
    return;
  }

  const props: any = await getPropertyStats(ctx.query);

  const data = {
    collection,
    ...props,
  };
  ctx.body = data;
}

export { stats };

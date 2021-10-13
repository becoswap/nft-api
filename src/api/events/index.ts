import { Op } from 'sequelize';
import database from '../../database';
import { buildQuery } from '../../utils/query';

const Event = database.models.event;
const NFT = database.models.nft;

async function list(ctx) {
  const include = [];
  if (ctx.query.include == 'nft') {
    include.push({
      model: NFT,
      as: 'nft',
      attributes: ['name'],
    });
    delete ctx.query.include;
  }

  const query = buildQuery(ctx, Event);

  if (ctx.query.from) {
    delete query.where.from;
    query.where[Op.or] = [
      {
        from: ctx.query.from,
      },
      {
        metadata: {
          buyer: ctx.query.from,
        },
      },
      {
        metadata: {
          seller: ctx.query.from,
        },
      },
    ];
  }

  const nfts = await Event.findAndCountAll({
    ...query,
    include,
  });
  ctx.status = 200;
  ctx.body = nfts;
}

export default {
  list,
};

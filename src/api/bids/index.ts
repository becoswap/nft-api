import database from '../../database';
import { buildQuery } from '../../utils/query';

const Bid = database.models.bid;
const Nft = database.models.nft;
const User = database.models.user;

async function list(ctx) {
  const nftWhere: any = {};
  if (ctx.query.seller) {
    nftWhere.owner = ctx.query.seller;
    delete ctx.query.seller;
  }

  const query = buildQuery(ctx, Bid);

  const nfts = await Bid.findAndCountAll({
    ...query,
    include: [
      {
        model: Nft,
        as: 'nft',
        where: nftWhere,
        include: [
          {
            model: User,
            attributes: ['name', 'avatar', 'website'],
            as: 'creatorInfo',
          },
        ],
      },
    ],
  });
  ctx.status = 200;
  ctx.body = nfts;
}

export default {
  list,
};

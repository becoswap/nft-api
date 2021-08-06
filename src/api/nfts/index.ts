import { Op } from 'sequelize';
import database from '../../database';
import { buildQuery } from '../../utils/query';

const NFT = database.models.nft;
const User = database.models.user;

async function list(ctx) {
  const query = buildQuery(
    ctx,
    ['creator', 'owner', 'onSale', 'status', 'nftType'],
    ['updatedAt', 'votes']
  );
  const nfts = await NFT.findAndCountAll({
    ...query,
    include: [
      {
        model: User,
        attributes: ['name', 'avatar', 'website'],
        as: 'creatorInfo',
      },
    ],
  });
  ctx.status = 200;
  ctx.body = nfts;
}

export default {
  list,
};

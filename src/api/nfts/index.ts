import { Op } from 'sequelize';
import database from '../../database';
import { buildQuery } from '../../utils/query';

const NFT = database.models.nft;
const User = database.models.user;

async function list(ctx) {
  const query = buildQuery(
    ctx,
    ['creator', 'owner', 'onSale', 'status', 'nftType'],
    ['updatedAt', 'votes', 'price']
  );

  if (ctx.query.q) {
    query.where.name = {
      [Op.like]: `%${ctx.query.q}%`,
    };
  }

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

async function update(ctx) {
  const nft = await NFT.findByPk(ctx.params.id);
  if (!nft) {
    ctx.status = 404;
    ctx.message = 'nft not foud';
  }

  nft.setAttributes(ctx.request.body);
  await nft.save();
  ctx.body = nft;
}

export default {
  list,
  update,
};

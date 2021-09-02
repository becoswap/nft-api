import { Op } from 'sequelize';
import database from '../../database';
import { buildQuery } from '../../utils/query';

const NFT = database.models.nft;
const User = database.models.user;

const ALLOW_FILTER_FIELDS = ['creator', 'owner', 'onSale', 'status', 'nftType'];

function buildQueryRobot(query, ctx) {
  let rangeFields = ['attributes.level'];
  for (const field of rangeFields) {
    if (ctx.query[field]) {
      const range = ctx.query[field].split(',');
      if (range.length === 2) {
        query.where[field] = {
          [Op.gte]: range[0],
          [Op.lte]: range[1],
        };
      }
    }
  }
  rangeFields = ['attributes.stats.strength', 'attributes.stats.speed', 'attributes.stats.hp'];
  for (var i = 0; i < rangeFields.length; i++) {
    const field = rangeFields[i];
    if (ctx.query[field]) {
      const range = ctx.query[field].split(',');
      if (range.length === 2) {
        query.where['attributes.stats'] = {
          [i]: {
            [Op.gte]: range[0],
            [Op.lte]: range[1],
          },
        };
      }
    }
  }
}

const buildQueryFn = {
  3: buildQueryRobot,
};

async function list(ctx) {
  const query = buildQuery(ctx, ALLOW_FILTER_FIELDS, ['updatedAt', 'votes', 'price', 'createdAt']);

  if (ctx.query.q) {
    query.where.name = {
      [Op.iLike]: `%${ctx.query.q}%`,
    };
  }

  if (buildQueryFn[ctx.query.nftType]) {
    buildQueryFn[ctx.query.nftType](query, ctx);
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

async function get(ctx) {
  const nft = await NFT.findByPk(ctx.params.id);
  ctx.status = 200;
  ctx.body = nft;
}

async function count(ctx) {
  const query = buildQuery(ctx, ALLOW_FILTER_FIELDS, []);

  if (ctx.query.q) {
    query.where.name = {
      [Op.iLike]: `%${ctx.query.q}%`,
    };
  }

  if (buildQueryFn[ctx.query.nftType]) {
    buildQueryFn[ctx.query.nftType](query, ctx);
  }

  const count = await NFT.count(query);
  ctx.status = 200;
  ctx.body = {
    count,
  };
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
  count,
  get,
};

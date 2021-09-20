import { Op } from 'sequelize';
import sequelize from '../../database';
import database from '../../database';
import { buildQuery } from '../../utils/query';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../../constants';
import { escape } from 'sqlstring';

const NFT = database.models.nft;
const User = database.models.user;
const Property = database.models.nft_property;

function addPropertyFilter(
  valueField: string,
  innerJoins,
  i: number,
  name: string,
  condition: string,
  rawValue: string
) {
  var values: any = rawValue.split(',').map(v => {
    return escape(v);
  });

  let op = '=';
  switch (condition) {
    case 'lte':
      op = '<=';
      break;
    case 'gte':
      op = '>=';
      break;
    case 'in':
      op = 'in';
      break;
  }

  if (op != 'in') {
    values = values[0];
  } else {
    values = `(${values.join(',')})`;
  }

  innerJoins.push(`
            INNER JOIN nft_properties AS np_${i} 
            ON nfts.id=np_${i}."nftId" 
            AND np_${i}.name=${name} AND np_${i}."${valueField}" ${op} ${values}`);
}

async function list(ctx) {
  const innerJoins = [];
  const limit = ctx.query.limit || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) {
    throw Error('limit must be less than ' + MAX_LIMIT);
  }

  let i = 0;
  for (var field in ctx.query) {
    i++;
    if (field.startsWith('int_')) {
      const keys = field.replace('int_', '').split('__');
      const name = escape(keys[0]);
      if (keys.length == 2) {
        addPropertyFilter('intValue', innerJoins, i, name, keys[1], ctx.query[field]);
      } else {
        addPropertyFilter('intValue', innerJoins, i, name, 'in', ctx.query[field]);
      }
      delete ctx.query[field];
    } else if (field.startsWith('string_')) {
      const keys = field.replace('string_', '').split('__');
      const name = escape(keys[0]);
      if (keys.length == 2) {
        addPropertyFilter('value', innerJoins, i, name, keys[1], ctx.query[field]);
      } else {
        addPropertyFilter('value', innerJoins, i, name, 'in', ctx.query[field]);
      }
      delete ctx.query[field];
    }
  }

  const whereAnd = [];

  if (ctx.query['nftType']) {
    whereAnd.push(`nfts."nftType" = ${escape(ctx.query['nftType'])}`);
  }

  if (ctx.query['onSale'] != undefined) {
    whereAnd.push(`nfts."onSale" = ${escape(ctx.query['onSale'])}`);
  }

  if (ctx.query['owner']) {
    whereAnd.push(`nfts."owner" = ${escape(ctx.query['owner'])}`);
  }

  if (ctx.query['creator']) {
    whereAnd.push(`nfts."creator" = ${escape(ctx.query['creator'])}`);
  }

  if (ctx.query.status) {
    whereAnd.push(`nfts."status" = ${escape(ctx.query.status)}`);
  }

  if (ctx.query.q) {
    const q = `%${ctx.query.q}%`;
    whereAnd.push(`nfts."name" like ${escape(q)}`);
  }

  if (ctx.query['ids']) {
    const ids = ctx.query['ids']
      .split(',')
      .map(id => escape(id))
      .join(',');
    whereAnd.push(`nfts."id" in (${ids})`);
  }

  if (whereAnd.length > 0) {
    innerJoins.push(`
            WHERE ${whereAnd.join(' AND ')} `);
  }
  const count = await sequelize.query('SELECT count(nfts.id) FROM nfts ' + innerJoins.join(' '));

  if (ctx.query.orderBy) {
    let orderDirection = 'desc';
    if (ctx.query.orderDirection === 'asc') {
      orderDirection = 'asc';
    }

    if (['votes', 'price', 'createdAt', 'id', 'nftId'].includes(ctx.query.orderBy)) {
      innerJoins.push(`ORDER BY nfts."${ctx.query.orderBy}" ${orderDirection}`);
    }
  }

  if (limit) {
    innerJoins.push(`LIMIT ${escape(limit)} OFFSET ${escape(ctx.query.offset || 0)}`);
  }

  const rows = await sequelize.query('SELECT nfts.id FROM nfts ' + innerJoins.join(' '));

  const nfts = await NFT.findAll({
    where: {
      id: {
        [Op.in]: rows[0].map(r => r.id),
      },
    },
    include: [
      {
        model: User,
        attributes: ['name', 'avatar', 'website'],
        as: 'creatorInfo',
      },

      {
        model: Property,
        as: 'properties',
        attributes: ['name', 'type', 'intValue', 'maxValue', 'value', 'image'],
      },
    ],
  });

  const nftById = {};
  for (let nft of nfts) {
    nftById[nft.id] = nft;
  }

  ctx.status = 200;
  ctx.body = {
    count: Number(count[0][0].count),
    rows: rows[0].map(r => nftById[r.id]),
  };
}

async function get(ctx) {
  const nft = await NFT.findByPk(ctx.params.id);
  ctx.status = 200;
  ctx.body = nft;
}

async function count(ctx) {
  const query = buildQuery(ctx, NFT);

  if (ctx.query.q) {
    query.where.name = {
      [Op.iLike]: `%${ctx.query.q}%`,
    };
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

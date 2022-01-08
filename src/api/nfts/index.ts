import { Op, QueryTypes } from 'sequelize';
import sequelize from '../../database';
import database from '../../database';
import { buildQuery } from '../../utils/query';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../../constants';
import NodeCache from 'node-cache';
import md5 from 'blueimp-md5';
import { search } from '../../elastic';

const NFT = database.models.nft;
const User = database.models.user;
const Property = database.models.nft_property;

const nftCache = new NodeCache({ stdTTL: 5, checkperiod: 10 });

const ALLOW_SORT_FIELDS = ['votes', 'price', 'createdAt', 'id', 'nftId', 'listedAt', 'soldAt'];

function addPropertyFilter(
  replacements,
  valueField: string,
  innerJoins,
  i: number,
  name: string,
  condition: string,
  rawValue: string
) {
  var values: any = rawValue.split(',');

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
  }

  innerJoins.push(`
            INNER JOIN nft_properties AS np_${i} 
            ON nfts.id=np_${i}."nftId" 
            AND np_${i}.name=? AND np_${i}."${valueField}"  ${op} (?)`);
  replacements.push(name, values);
}

async function list(ctx) {
  const cacheKey = md5(JSON.stringify(ctx.query));
  const cacheValue = nftCache.get(cacheKey);
  if (cacheValue) {
    ctx.body = cacheValue;
    return;
  }

  const innerJoins = [];
  let replacements = [];
  const limit = ctx.query.limit || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) {
    throw Error('limit must be less than ' + MAX_LIMIT);
  }

  let i = 0;
  for (var field in ctx.query) {
    i++;
    if (field.startsWith('int_')) {
      const keys = field.replace('int_', '').split('__');
      const name = keys[0];
      if (keys.length == 2) {
        addPropertyFilter(replacements, 'intValue', innerJoins, i, name, keys[1], ctx.query[field]);
      } else {
        addPropertyFilter(replacements, 'intValue', innerJoins, i, name, 'in', ctx.query[field]);
      }
      delete ctx.query[field];
    } else if (field.startsWith('string_')) {
      const keys = field.replace('string_', '').split('__');
      const name = keys[0];
      if (keys.length == 2) {
        addPropertyFilter(replacements, 'value', innerJoins, i, name, keys[1], ctx.query[field]);
      } else {
        addPropertyFilter(replacements, 'value', innerJoins, i, name, 'in', ctx.query[field]);
      }
      delete ctx.query[field];
    }
  }

  const whereAnd = [];

  if (ctx.query['nftType']) {
    whereAnd.push(`nfts."nftType" = ?`);
    replacements.push(ctx.query['nftType']);
  }

  if (ctx.query['onSale'] != undefined) {
    whereAnd.push(`nfts."onSale" =?`);
    replacements.push(ctx.query['onSale']);
  }

  if (ctx.query['owner']) {
    whereAnd.push(`nfts."owner" =?`);
    replacements.push(ctx.query['owner']);
  }

  if (ctx.query['creator']) {
    whereAnd.push(`nfts."creator" = ?`);
    replacements.push(ctx.query['creator']);
  }

  if (ctx.query.status) {
    whereAnd.push(`nfts."status" = ?`);
    replacements.push(ctx.query['status']);
  }

  if (ctx.query.q) {
    const q = `%${ctx.query.q}%`;
    whereAnd.push(`nfts."name" ilike ?`);
    replacements.push(q);
  }

  if (ctx.query['ids']) {
    const ids = ctx.query['ids'].split(',');
    whereAnd.push(`nfts."id" in (?)`);

    replacements.push(ids);
  }

  if (whereAnd.length > 0) {
    innerJoins.push(`
            WHERE ${whereAnd.join(' AND ')} `);
  }

  const count = await sequelize.query('SELECT count(nfts.id) FROM nfts ' + innerJoins.join(' '), {
    type: QueryTypes.SELECT,
    replacements,
  });
  if (ctx.query.orderBy) {
    let orderDirection = 'desc';
    if (ctx.query.orderDirection === 'asc') {
      orderDirection = 'asc';
    }

    if (ALLOW_SORT_FIELDS.includes(ctx.query.orderBy)) {
      if (orderDirection == 'asc') {
        innerJoins.push(`ORDER BY nfts."${ctx.query.orderBy}" ASC NULLS LAST`);
      } else {
        innerJoins.push(`ORDER BY nfts."${ctx.query.orderBy}" DESC NULLS LAST`);
      }
    }
  }

  if (limit) {
    innerJoins.push(`LIMIT ? OFFSET ?`);
    replacements.push(limit, ctx.query.offset);
  }

  const rows = await sequelize.query('SELECT nfts.id FROM nfts ' + innerJoins.join(' '), {
    type: QueryTypes.SELECT,
    replacements,
  });
  const nfts = await NFT.findAll({
    where: {
      id: {
        [Op.in]: rows.map(r => r.id),
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

  const body = {
    count: Number(count[0].count),
    rows: rows.map(r => nftById[r.id]),
  };
  nftCache.set(cacheKey, JSON.stringify(body));
  ctx.body = body;
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
  if (!nft || nft.nftType != 2) {
    ctx.status = 404;
    ctx.message = 'nft not foud';
  }

  nft.status = ctx.request.body.status;
  await nft.save();
  ctx.body = nft;
}

async function listV2(ctx) {
  if (ctx.query.onSale) {
    ctx.query.onSale = ctx.query.onSale === '1' ? true : false;
  }

  try {
    const data = await search(ctx.query);

    ctx.status = 200;
    ctx.body = {
      count: data.hits.total.value,
      rows: data.hits.hits.map(r => {
        r = r._source;
        r.properties = r.properties || [];
        return r;
      }),
    };
  } catch (e) {
    ctx.status = 500;
  }
}

export default {
  list,
  update,
  count,
  get,
  listV2,
};

import { Op } from 'sequelize';
import sequelize from '../../database';
import database from '../../database';
import { buildQuery } from '../../utils/query';
import jsStringEscape from 'js-string-escape';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../../constants';

const NFT = database.models.nft;
const User = database.models.user;
const Property = database.models.nft_property;

async function list(ctx) {
  const innerJoins = [];
  const limit = ctx.query.limit || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) {
    throw Error('limit must be less than ' + MAX_LIMIT);
  }

  for (var field in ctx.query) {
    if (field.startsWith('int_')) {
      const keys = field.replace('int_', '').split('__');
      if (keys.length == 2) {
        const key = jsStringEscape(keys[0]);
        const values = ctx.query[field].split(',').map(v => {
          return jsStringEscape(v);
        });

        let op = '=';
        switch (keys[1]) {
          case 'lte':
            op = '<=';
            break;
          case 'gte':
            op = '>=';
            break;
        }

        innerJoins.push(`
            INNER JOIN nft_properties AS np_${key} 
            ON nfts.id=np_${key}."nftId" 
            AND np_${key}.name='${key}' AND np_${key}."intValue" ${op} ${values[0]}`);
      } else {
        const key = jsStringEscape(keys[0]);
        const values = ctx.query[field].split(',').map(v => {
          return jsStringEscape(v);
        });
        innerJoins.push(`
            INNER JOIN nft_properties AS np_${key} 
            ON nfts.id=np_${key}."nftId" 
            AND np_${key}.name='${key}' AND np_${key}."intValue" =  ${values[0]}`);
      }
      delete ctx.query[field];
    } else if (field.startsWith('string_')) {
      const keys = field.replace('string_', '').split('__');
      const key = jsStringEscape(keys[0]);
      const values = ctx.query[field]
        .split(',')
        .map(v => {
          return `'${jsStringEscape(v)}'`;
        })
        .join(',');

      innerJoins.push(`
            INNER JOIN nft_properties AS np_${key} 
            ON nfts.id=np_${key}."nftId" 
            AND np_${key}.name='${key}' AND np_${key}.value in (${values})`);
      delete ctx.query[field];
    }
  }

  const whereAnd = [];

  if (ctx.query['nftType']) {
    whereAnd.push(`nfts."nftType" = ${jsStringEscape(ctx.query['nftType'])}`);
  }

  if (ctx.query['onSale']) {
    whereAnd.push(`nfts."onSale" = ${jsStringEscape(ctx.query['nftType'])}`);
  }

  if (ctx.query['owner']) {
    whereAnd.push(`nfts."owner" = '${jsStringEscape(ctx.query['owner'])}'`);
  }

  if (ctx.query['creator']) {
    whereAnd.push(`nfts."creator" = '${jsStringEscape(ctx.query['creator'])}'`);
  }

  if (ctx.query.status) {
    whereAnd.push(`nfts."status" = ${jsStringEscape(ctx.query.status)}`);
  }

  if (ctx.query['ids']) {
    const ids = ctx.query['ids']
      .split(',')
      .map(id => `'${jsStringEscape(id)}'`)
      .join(',');
    whereAnd.push(`nfts."id" in (${ids})`);
  }

  if (whereAnd.length > 0) {
    innerJoins.push(`
            WHERE ${whereAnd.join(' AND ')} `);
  }
  const count = await sequelize.query('SELECT count(nfts.id) FROM nfts ' + innerJoins.join(' '));

  if (ctx.query.orderName) {
    let orderDirection = 'DESC';
    if (ctx.query.orderBy === 'ASC') {
      orderDirection = 'ASC';
    }

    innerJoins.push(`ORDER BY "${jsStringEscape(ctx.query.orderName)}" ${orderDirection}`);
  }

  if (limit) {
    innerJoins.push(
      `LIMIT ${jsStringEscape(limit)} OFFSET ${jsStringEscape(ctx.query.offset || 0)}`
    );
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
  ctx.status = 200;
  ctx.body = {
    count: Number(count[0][0].count),
    rows: nfts,
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

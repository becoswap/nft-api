import { Op } from 'sequelize';
import database from '../../database';
import { buildQuery } from '../../utils/query';

const NFT = database.models.nft;
const User = database.models.user;
const Property = database.models.nft_property;

async function list(ctx) {
  const include = [];

  let propertyWhere = {
    [Op.and]: [],
  };
  for (var field in ctx.query) {
    if (field.startsWith('int_')) {
      const keys = field.replace('int_', '').split('__');
      if (keys.length == 2) {
        if (Op[keys[1]]) {
          let values = ctx.query[field];
          if (!Array.isArray(values) && ['in', 'notIn'].includes(keys[1])) {
            values = values.split(',');
          }
          propertyWhere[Op.and].push({
            name: keys[0],
            intValue: {
              [Op[keys[1]]]: values,
            },
          });
        } else {
          throw Error('invalid query');
        }
      } else {
        propertyWhere[Op.and].push({
          name: keys[0],
          intValue: ctx.query[field],
        });
      }
      delete ctx.query[field];
    } else if (field.startsWith('string_')) {
      const keys = field.replace('string_', '').split('__');
      if (keys.length == 2) {
        if (Op[keys[1]]) {
          let values = ctx.query[field];
          if (!Array.isArray(values) && ['in', 'notIn'].includes(keys[1])) {
            values = values.split(',');
          }
          propertyWhere[Op.and].push({
            name: keys[0],
            value: {
              [Op[keys[1]]]: values,
            },
          });
        } else {
          throw Error('invalid query');
        }
      } else {
        propertyWhere[Op.and].push({
          name: keys[0],
          value: ctx.query[field],
        });
      }
      delete ctx.query[field];
    }
  }

  if (propertyWhere[Op.and].length > 0) {
    include.push({
      model: Property,
      as: 'search_properties',
      attributes: [],
      where: propertyWhere,
    });
  }

  const query: any = buildQuery(ctx, NFT);
  const nfts = await NFT.findAndCountAll({
    ...query,
    distinct: true,
    include: [
      {
        model: User,
        attributes: ['name', 'avatar', 'website'],
        as: 'creatorInfo',
      },
      ...include,

      {
        model: Property,
        as: 'properties',
        attributes: ['name', 'type', 'intValue', 'maxValue', 'value', 'image'],
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

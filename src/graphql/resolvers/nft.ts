import { QueryTypes, Op } from 'sequelize';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../../constants';
import sequelize from '../../database';
import database from '../../database';

const NFT = database.models.nft;
const User = database.models.user;
const Property = database.models.nft_property;

function buildQuery(args) {
  let replacements = [];
  const and = [];
  const joins = [];

  if (!args.where) {
    return {
      replacements,
      joins,
    };
  }

  if (args.where.stringProperties) {
    var propery;
    for (let i = 0; i < args.where.stringProperties.length; i++) {
      propery = args.where.stringProperties[i];
      joins.push(`
        INNER JOIN nft_properties AS np_${i} 
        ON nfts.id=np_${i}."nftId" 
        AND np_${i}.name=? AND np_${i}."value"  in (?)
      `);
      replacements.push(propery.name, propery.values);
    }
    delete args.where.stringProperties;
  }

  if (args.where.intProperties) {
    var propery;
    for (let i = 0; i < args.where.intProperties.length; i++) {
      propery = args.where.intProperties[i];
      joins.push(`
        INNER JOIN nft_properties AS np_${i} 
        ON nfts.id=np_${i}."nftId" 
        AND np_${i}.name=? AND np_${i}."intValue" >= ? AND np_${i}."intValue" <=?
      `);
      replacements.push(propery.name, propery.ranges.min, propery.ranges.max);
    }
    delete args.where.intProperties;
  }

  for (let key in args.where) {
    const keyArr = key.split('__');
    if (keyArr.length > 1) {
      switch (keyArr[1]) {
        case 'in':
          and.push(`nfts."${keyArr[0]}" in (?)`);
          break;
        default:
          and.push(`nfts."${keyArr[0]}" = ?`);
      }
    } else {
      and.push(`nfts."${keyArr[0]}" = ?`);
    }
    replacements.push(args.where[key]);
  }

  joins.push(`WHERE ${and.join(' AND ')}`);
  return {
    replacements,
    joins,
  };
}

const nftResolver = {
  Query: {
    async nft(root, args) {
      return await NFT.findOne({
        where: {
          id: args.id,
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
    },

    async nftCount(root, args) {
      const { replacements, joins } = buildQuery(args);
      const rows = await sequelize.query('SELECT count(nfts.id) FROM nfts ' + joins.join(' '), {
        type: QueryTypes.SELECT,
        replacements,
      });
      return rows[0].count;
    },

    async nfts(root, args) {
      args.offset = args.offset || 0;
      args.limit = args.limit || DEFAULT_LIMIT;
      if (args.limit > MAX_LIMIT) {
        throw Error('limit must be less than ' + MAX_LIMIT);
      }

      const { replacements, joins } = buildQuery(args);

      if (args.orderBy) {
        joins.push(`ORDER BY nfts."${args.orderBy}" ${args.orderDirection || 'DESC'}`);
      }

      // LIMIT/OFFSET
      joins.push('LIMIT ? OFFSET ?');
      replacements.push(args.limit, args.offset);

      const rows = await sequelize.query('SELECT nfts.id FROM nfts ' + joins.join(' '), {
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

      return rows.map(r => nftById[r.id]);
    },
  },
};

export default nftResolver;

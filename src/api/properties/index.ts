import { QueryTypes } from 'sequelize';
import NodeCache from 'node-cache';
import sequelize from '../../database';
import md5 from 'blueimp-md5';
const Collection = sequelize.models.collection;

const myCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

async function stats(ctx) {
  let replacements = [];
  const whereArr = [];
  const nftType = ctx.query.nftType || 3;

  whereArr.push(`nfts."nftType" = ?`);
  replacements.push(nftType);

  if (ctx.query.owner) {
    whereArr.push(`nfts."owner" = ?`);
    replacements.push(ctx.query.owner);
  }

  if (ctx.query.creator) {
    whereArr.push(`nfts."creator" = ?`);
    replacements.push(ctx.query.creator);
  }

  const cacheKey = md5(replacements.join(':') + whereArr.join(':'));
  const cacheValue = myCache.get(cacheKey);
  console.log(cacheKey);
  if (cacheValue) {
    ctx.body = cacheValue;
    return;
  }

  const collection = await Collection.findByPk(nftType);

  if (!collection) {
    ctx.status = 400;
    ctx.body = {
      message: 'Collection not found',
    };
    return;
  }

  const whereStr = whereArr.join(' and  ');

  let properties = await sequelize.query(
    `select count(nft_properties.name),nft_properties."value", nft_properties.name from nft_properties inner join nfts on nft_properties."nftId"=nfts.id and ${whereStr} where "type" in ('property', 'other_string') and "value" IS NOT NULL group by nft_properties.name,nft_properties."value"`,
    { type: QueryTypes.SELECT, replacements }
  );

  const stringPropertiesCache = {};

  for (var p of properties) {
    if (!stringPropertiesCache[p.name]) {
      stringPropertiesCache[p.name] = [];
    }

    stringPropertiesCache[p.name].push({
      value: p.value,
      count: p.count,
    });
  }

  const stringProperties = Object.keys(stringPropertiesCache).map(k => {
    return {
      key: k,
      values: stringPropertiesCache[k],
    };
  });

  properties = await sequelize.query(
    `select  min(nft_properties."intValue"), max(nft_properties."intValue"), nft_properties."name" from nft_properties inner join nfts on nft_properties."nftId"=nfts.id and ${whereStr} where "type" in ('stats', 'level', 'other') group by nft_properties.name`,
    { type: QueryTypes.SELECT, replacements }
  );

  const data = {
    collection,
    stringProperties: stringProperties,
    numberProperties: properties
      .map(p => {
        return {
          key: p.name,
          value: {
            min: p.min,
            max: p.max,
          },
        };
      })
      .filter(a => a.value.max > 0),
  };
  myCache.set(cacheKey, data);
  ctx.body = data;
}

export { stats };

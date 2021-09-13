import { QueryTypes } from 'sequelize';
import sequelize from '../../database';

async function stats(ctx) {
  let properties = await sequelize.query(
    `select count(nft_properties.name),nft_properties."value", nft_properties.name from nft_properties inner join nfts on nft_properties."nftId"=nfts.id and nfts."nftType"=?  where "type" in ('property') group by nft_properties.name,nft_properties."value"`,
    { type: QueryTypes.SELECT, replacements: [ctx.query.nftType] }
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
    `select  min(nft_properties."intValue"), max(nft_properties."intValue"), nft_properties."name" from nft_properties inner join nfts on nft_properties."nftId"=nfts.id and nfts."nftType"=?  where "type" in ('stats', 'level', 'other') group by nft_properties.name,nft_properties."value"`,
    { type: QueryTypes.SELECT, replacements: [ctx.query.nftType] }
  );

  ctx.body = {
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
}

export { stats };

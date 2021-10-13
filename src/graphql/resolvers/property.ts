import { QueryTypes } from 'sequelize';
import sequelize from '../../database';

const propertyResolver = {
  Query: {
    async propertyStats(root, args) {
      let replacements = [];
      const whereArr = [];
      args.where = args.where || {};

      for (let key in args.where) {
        whereArr.push(`nfts."${key}" = ?`);
        replacements.push(args.where[key]);
      }

      let whereStr = '';
      if (whereArr.length > 0) {
        whereStr = 'AND ' + whereArr.join(' and  ');
      }

      let properties = await sequelize.query(
        `select count(nft_properties.name),nft_properties."value", nft_properties.name from nft_properties inner join nfts on nft_properties."nftId"=nfts.id ${whereStr} where "type" in ('property', 'other_string') and "value" IS NOT NULL group by nft_properties.name,nft_properties."value"`,
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
        `select  min(nft_properties."intValue"), max(nft_properties."intValue"), nft_properties."name" from nft_properties inner join nfts on nft_properties."nftId"=nfts.id ${whereStr} where "type" in ('stats', 'level', 'other') group by nft_properties.name`,
        { type: QueryTypes.SELECT, replacements }
      );

      return {
        stringProperties: stringProperties,
        intProperties: properties
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
    },
  },
};

export default propertyResolver;

import { MAX_LIMIT } from '../../constants';
import database from '../../database';
const Collection = database.models.collection;

const collectionResolver = {
  Query: {
    async collections(root, args) {
      if (args.limit > MAX_LIMIT) {
        throw Error('limit must be less than ' + MAX_LIMIT);
      }

      return Collection.findAll({
        where: args.where,
        limit: args.limit,
        offset: args.offset,
        order: [
          // Will escape title and validate DESC against a list of valid direction parameters
          [args.orderBy, args.orderDirection],
        ],
      });
    },

    async collectionCount(root, args) {
      return Collection.count({
        where: args.where,
      });
    },
  },
};

export default collectionResolver;

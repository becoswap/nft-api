import { MAX_LIMIT } from '../../constants';
import database from '../../database';
const User = database.models.user;

const userResolver = {
  Query: {
    async users(root, args) {
      if (args.limit > MAX_LIMIT) {
        throw Error('limit must be less than ' + MAX_LIMIT);
      }

      return User.findAll({
        where: args.where,
        limit: args.limit,
        offset: args.offset,
        order: [
          // Will escape title and validate DESC against a list of valid direction parameters
          [args.orderBy, args.orderDirection],
        ],
      });
    },

    async userCount(root, args) {
      return User.count({
        where: args.where,
      });
    },

    async user(root, args) {
      return User.findByPk(args.id);
    },
  },
};

export default userResolver;

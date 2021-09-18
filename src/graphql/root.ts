import { resolver, defaultArgs } from 'graphql-sequelize';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../constants';
import database from '../database';
import { buildWhere } from '../utils/query';

// The root provides a resolver function for each API endpoint
const root = {
  Query: {
    nfts: resolver(database.models.nft, {
      /**
       * Manipulate the query before it's sent to Sequelize.
       * @param findOptions {object} - Options sent to Seqeulize model's find function
       * @param args {object} - The arguments from the incoming GraphQL query
       * @param context {object} - Resolver context, see more at GraphQL docs below.
       * @returns findOptions or promise that resolves with findOptions
       */
      before: (findOptions, args, context) => {
        findOptions.where = buildWhere(args.where);
        findOptions.limit = findOptions.limit | DEFAULT_LIMIT;
        if (findOptions.limit > MAX_LIMIT) {
          throw Error('limit must be less than ' + MAX_LIMIT);
        }
        return findOptions;
      },
    }),
  },
};

export default root;

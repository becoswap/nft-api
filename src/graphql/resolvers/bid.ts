import { MAX_LIMIT } from '../../constants';
import database from '../../database';
const Bid = database.models.bid;
const Nft = database.models.nft;
const User = database.models.user;

const bidResolver = {
  Query: {
    async bids(root, args) {
      if (args.limit > MAX_LIMIT) {
        throw Error('limit must be less than ' + MAX_LIMIT);
      }
      args.where = args.where || {};
      const nftWhere = args.where ? args.where.nft : undefined;
      delete args.where.nft;
      return Bid.findAll({
        where: args.where,
        limit: args.limit,
        offset: args.offset,
        include: [
          {
            model: Nft,
            as: 'nft',
            where: nftWhere,
            include: [
              {
                model: User,
                attributes: ['name', 'avatar', 'website'],
                as: 'creatorInfo',
              },
            ],
          },
        ],
        order: [
          // Will escape title and validate DESC against a list of valid direction parameters
          [args.orderBy, args.orderDirection],
        ],
      });
    },

    async bid(root, args) {
      return Bid.findByPk(args.id);
    },

    async bidCount(root, args) {
      args.where = args.where || {};
      const nftWhere = args.where ? args.where.nft : undefined;
      delete args.where.nft;
      return Bid.count({
        where: args.where,
        include: [
          {
            model: Nft,
            as: 'nft',
            where: nftWhere,
            include: [
              {
                model: User,
                attributes: ['name', 'avatar', 'website'],
                as: 'creatorInfo',
              },
            ],
          },
        ],
      });
    },
  },
};

export default bidResolver;

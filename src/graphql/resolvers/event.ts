import database from '../../database';
const Event = database.models.event;

const eventResolver = {
  Query: {
    async events(root, args) {
      return Event.findAll({
        where: args.where,
        limit: args.limit,
        offset: args.offset,
        order: [
          // Will escape title and validate DESC against a list of valid direction parameters
          [args.orderBy, args.orderDirection],
        ],
      });
    },

    async eventCount(root, args) {
      return Event.count({
        where: args.where,
      });
    },
  },
};

export default eventResolver;

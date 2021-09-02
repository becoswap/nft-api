import { Op } from 'sequelize';

const buildQuery = (ctx, filterFields, orderFields) => {
  let limit = ctx.query.limit || 10;

  if (limit > 1000) {
    throw Error('limit must be less than 10000');
  }

  let offset = ctx.query.offset || 0;

  if (ctx.query.page > 1) {
    offset = limit * (ctx.query.page - 1);
  }

  let query: any = {
    where: {},
    limit,
    offset,
  };

  if (ctx.query.ids) {
    query.where.id = {
      [Op.in]: ctx.query.ids.split(','),
    };
  }

  if (ctx.query.orderName && orderFields.includes(ctx.query.orderName)) {
    let orderBy = 'DESC';
    if (ctx.query.orderBy == 'asc') {
      orderBy = 'ASC';
    }

    query.order = [[ctx.query.orderName, orderBy]];
  }

  for (var field of filterFields) {
    if (typeof ctx.query[field] != 'undefined') {
      const values = ctx.query[field].split(',');
      if (values.length == 1) {
        query.where[field] = ctx.query[field];
      } else {
        query.where[field] = {
          [Op.in]: values,
        };
      }
    }
  }
  return query;
};

export { buildQuery };

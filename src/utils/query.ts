import { Op } from 'sequelize';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../constants';

export const buildWhere = input => {
  let where: any = {};

  for (var key in input) {
    const keys = key.split('__');
    if (keys.length == 2) {
      if (Op[keys[1]]) {
        let values = input[key];
        if (!Array.isArray(values) && ['in', 'notIn'].includes(keys[1])) {
          values = values.split(',');
        }

        where[keys[0]] = {
          [Op[keys[1]]]: values,
        };
      } else {
        throw Error('invalid query');
      }
    } else {
      where[keys[0]] = input[key];
    }
  }
  return where;
};

const buildQuery = (ctx, Model) => {
  const input = Object.assign({}, ctx.query);

  let limit = input.limit || DEFAULT_LIMIT;
  delete input.limit;
  if (limit > MAX_LIMIT) {
    throw Error('limit must be less than ' + MAX_LIMIT);
  }

  let offset = input.offset || 0;
  delete input.offset;
  if (input.page > 1) {
    offset = limit * (input.page - 1);
  }

  let query: any = {
    where: {},
    limit,
    offset,
  };

  if (input.ids) {
    query.where.id = {
      [Op.in]: input.ids.split(','),
    };
    delete input.ids;
  }

  if (input.orderBy) {
    let orderDirection = 'DESC';
    if (input.orderDirection == 'asc') {
      orderDirection = 'ASC';
    }

    query.order = [[input.orderBy, orderDirection]];
    delete input.orderBy;
    delete input.orderDirection;
  }

  query.where = {
    ...query.where,
    ...buildWhere(input),
  };
  return query;
};

export { buildQuery };

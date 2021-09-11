import { Op } from 'sequelize';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../constants';

export const buildWhere = (input, Model) => {
  let where: any = {};

  for (var key in input) {
    const keys = key.split('__');
    if (keys.length == 2) {
      if (Op[keys[1]]) {
        let values = input[key];
        if (!Array.isArray(values) && ['in', 'notIn'].includes(keys[1])) {
          values = values.split(',');
        }

        if (!Model.rawAttributes[keys[0]]) {
          where.attributes = where.attributes || {};
          where.attributes = {
            [keys[0]]: {
              [Op[keys[1]]]: values,
            },
          };
        } else {
          where[keys[0]] = {
            [Op[keys[1]]]: values,
          };
        }
      } else {
        throw Error('invalid query');
      }
    } else {
      if (!Model.rawAttributes[keys[0]]) {
        where.attributes = where.attributes || {};
        where.attributes[keys[0]] = input[key];
      } else {
        where[keys[0]] = input[key];
      }
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

  if (input.orderName) {
    let orderBy = 'DESC';
    if (input.orderBy == 'asc') {
      orderBy = 'ASC';
    }

    query.order = [[input.orderName, orderBy]];
    delete input.orderBy;
    delete input.orderName;
  }

  query.where = buildWhere(input, Model);
  return query;
};

export { buildQuery };

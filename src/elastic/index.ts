import { Client } from '@elastic/elasticsearch';
import { getEsIndex } from '../utils/es';
const client = new Client({
  node: process.env.ES_URL,
});

export const getPropertyStats = async params => {
  let must = [];
  for (let key in params) {
    must.push({
      term: {
        [key]: params[key],
      },
    });
  }

  const { body } = await client.search({
    index: getEsIndex('nfts'),
    body: {
      size: 0,
      query: {
        bool: {
          must: must,
        },
      },
      aggs: {
        stats: {
          nested: {
            path: 'properties',
          },
          aggs: {
            names: {
              terms: {
                field: 'properties.name',
                size: 100,
              },
              aggs: {
                values: {
                  terms: {
                    size: 200,
                    field: 'properties.value',
                  },
                },
                max_value: { max: { field: 'properties.intValue' } },
                min_value: { min: { field: 'properties.intValue' } },
              },
            },
          },
        },
      },
    },
  });
  return {
    stringProperties: body.aggregations.stats.names.buckets
      .filter(a => a.values.buckets.length > 0)
      .map(b => {
        return {
          key: b.key,
          values: b.values.buckets.map(bb => {
            return {
              value: bb.key,
              count: bb.doc_count,
            };
          }),
        };
      }),
    numberProperties: body.aggregations.stats.names.buckets
      .filter(a => a.max_value.value > 0)
      .map(b => {
        return {
          key: b.key,
          value: {
            min: b.min_value.value,
            max: b.max_value.value,
          },
        };
      }),
  };
};

export const search = async params => {
  let must = [];
  const sort = [
    {
      [params.orderBy || 'id']: params.orderDirection || 'desc',
    },
  ];
  const from = params.offset;
  const size = params.limit;
  delete params.orderBy;
  delete params.orderDirection;
  delete params.limit;
  delete params.offset;

  for (let paramKey in params) {
    if (paramKey.startsWith('int_')) {
      let _paramKey = paramKey.replace('int_', '').split('__');
      let _must: any = {
        terms: {
          'properties.intValue': params[paramKey].split(','),
        },
      };
      if (_paramKey.length > 1) {
        switch (_paramKey[1]) {
          case 'lt':
          case 'gt':
          case 'lte':
          case 'gte':
            _must = {
              range: {
                'properties.intValue': { [_paramKey[1]]: params[paramKey] },
              },
            };
            break;
          case 'in':
          default:
        }
      }

      must.push({
        nested: {
          path: 'properties',
          query: {
            bool: {
              must: [
                {
                  term: {
                    'properties.name': _paramKey[0],
                  },
                },
                _must,
              ],
            },
          },
        },
      });
    } else if (paramKey.startsWith('string_')) {
      let _paramKey = paramKey.replace('string_', '').split('__');
      let _must: any = {
        terms: {
          'properties.value': params[paramKey].split(','),
        },
      };
      must.push({
        nested: {
          path: 'properties',
          query: {
            bool: {
              must: [
                {
                  term: {
                    'properties.name': _paramKey[0],
                  },
                },
                _must,
              ],
            },
          },
        },
      });
    } else if (paramKey == 'ids') {
      must.push({
        terms: {
          id: params[paramKey].split(','),
        },
      });
    } else if (paramKey == 'q') {
      must.push({
        multi_match: {
          query: params[paramKey],
          fields: ['id', 'name'],
        },
      });
    } else {
      let _paramKey = paramKey.split('__');
      let _must: any = {
        term: {
          [_paramKey[0]]: params[paramKey],
        },
      };
      if (_paramKey.length > 1) {
        switch (_paramKey[1]) {
          case 'lt':
          case 'gt':
          case 'lte':
          case 'gte':
            _must = {
              range: {
                [_paramKey[0]]: { [_paramKey[1]]: params[paramKey] },
              },
            };
            break;
          case 'in':
            _must = {
              terms: {
                [_paramKey[0]]: params[paramKey].split(','),
              },
            };
            break;
          default:
        }
      }
      must.push(_must);
    }
  }
  const { body } = await client.search({
    index: getEsIndex('nfts'),
    body: {
      track_total_hits: true,
      sort,
      from,
      size,
      query: {
        bool: {
          must,
        },
      },
    },
  });
  return body;
};

import { Client } from '@elastic/elasticsearch';
import { Op } from 'sequelize';
import database from '../database';
import { getEsIndex } from '../utils/es';
import { sleep } from '../utils/sleep';
const Message = database.models.message;
const NFT = database.models.nft;
const Property = database.models.nft_property;

const client = new Client({
  node: process.env.ES_URL,
});

let lastSyncId = 0;

async function runWorker() {
  const msgs = await Message.findAll({
    where: {
      id: {
        [Op.gt]: lastSyncId,
      },
    },
    offset: 0,
    limit: 500,
    order: [['id', 'ASC']],
  });
  if (msgs.length == 0) return false;
  let nfts = await NFT.findAll({
    where: {
      id: {
        [Op.in]: msgs.map(msg => msg.object_id),
      },
    },
    include: [
      {
        model: Property,
        as: 'properties',
      },
    ],
  });

  const docs = [];
  for (let nft of nfts) {
    const doc = {
      id: nft.id,
      creator: nft.creator,
      owner: nft.owner,
      collectionId: nft.nftType,
      token_id: nft.nftId,
      traits: [],
    };

    for (let prop of nft.properties) {
      doc.traits.push({
        name: prop.name,
        type: prop.type,
        value: prop.value,
        intValue: prop.intValue,
      });
    }
    docs.push(doc);
  }

  // sync to elastic search
  const body = docs.flatMap(doc => [{ index: { _index: getEsIndex('nfts'), _id: doc.id } }, doc]);
  body.push({ index: { _index: getEsIndex('sync_status'), _id: 'last_msg_id' } });
  body.push({ intValue: msgs[msgs.length - 1].id });
  await client.bulk({ refresh: true, body });
  lastSyncId = msgs[msgs.length - 1].id;

  return true;
}

export const _startIndexEs = async () => {
  while (true) {
    try {
      if (!(await runWorker())) {
        await sleep(5000);
      }
    } catch (e) {
      console.error('run index es err: ', e.message);
    }
  }
};

export const startIndexEs = async () => {
  await createIndexes();
  const { body } = await client.get(
    {
      index: getEsIndex('sync_status'),
      id: 'last_msg_id',
    },
    { ignore: [404] }
  );
  lastSyncId = body._source ? body._source.intValue : 0;
  console.log('last sync id: ', lastSyncId);
  _startIndexEs();
};

const createIndexes = async () => {
  await client.indices.create(
    {
      index: getEsIndex('nfts'),
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            collection_id: { type: 'integer' },
            token_id: { type: 'integer' },
            owner: { type: 'keyword' },
            creator: { type: 'keyword' },
            traits: {
              type: 'nested',
              properties: {
                name: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'keyword' },
                intValue: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    { ignore: [400] }
  );
  await client.indices.create(
    {
      index: getEsIndex('sync_status'),
      body: {
        mappings: {
          properties: {
            intValue: { type: 'integer' },
          },
        },
      },
    },
    { ignore: [400] }
  );
};

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
            path: 'traits',
          },
          aggs: {
            names: {
              terms: {
                field: 'traits.name',
                size: 100,
              },
              aggs: {
                values: {
                  terms: {
                    size: 200,
                    field: 'traits.value',
                  },
                },
                max_value: { max: { field: 'traits.intValue' } },
                min_value: { min: { field: 'traits.intValue' } },
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

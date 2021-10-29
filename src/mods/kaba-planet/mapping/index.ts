import { Event } from '@ethersproject/contracts';
import database from '../../../database';
import { saveTotalOwner } from '../../../utils/collection';
import { getNftId } from '../../../utils/nft';

const Property = database.models.nft_property;
const NFT = database.models.nft;
const Collection = database.models.collection;

const NFT_TYPE = 5;

const BID_CONTRACTS = [

]

function isBidContract(addr) {
  return BID_CONTRACTS.indexOf(addr) > -1
}

const PROPERTY_KEY = {
  SIZE: 'size',
  RARITY: 'rarity',
  CARD: 'card',
  PLANET_X: 'planet_x',
  PLANET_Y: 'planet_y',
};

const PROPERTY_TYPE = {
  LEVEL: 'level',
  DEFAULT: 'property',
  STATS: 'stats',
  OTHER: 'other',
};

const nameMaps = {
  rarity: [null, 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical', 'Immortal'],
  card: ['Titanium', 'Chromium', 'Osmium', 'Steel', 'Iridium', 'Tungsten'],
};

const WIDTH = 5000;

export const handleCreate = async (e: Event) => {
  const nftId = e.args.monsterId.toNumber();

  const x = nftId % WIDTH;
  const y = Math.floor(nftId / WIDTH);
  const width =  WIDTH/ 2
  const name = `PLANET (${x - width}, ${y - width})`

  const dataToCreate = {
    id: getNftId(NFT_TYPE, nftId),
    name,
    nftType: NFT_TYPE,
    nftId,
    creator: e.args.owner,
    owner: e.args.owner,
    votes: 0,
    status: 1,
    onSale: false,
    properties: [
      {
        type: PROPERTY_TYPE.STATS,
        name: PROPERTY_KEY.PLANET_X,
        intValue: x,
        maxValue: WIDTH,
      },
      {
        type: PROPERTY_TYPE.STATS,
        name: PROPERTY_KEY.PLANET_Y,
        intValue: y,
        maxValue: WIDTH,
      },
      {
        type: PROPERTY_TYPE.STATS,
        name: PROPERTY_KEY.SIZE,
        intValue: e.args.size,
        maxValue: 10,
      },
      {
        type: PROPERTY_TYPE.DEFAULT,
        name: PROPERTY_KEY.RARITY,
        value: nameMaps.rarity[e.args.rarity],
      },
      {
        type: PROPERTY_TYPE.DEFAULT,
        name: PROPERTY_KEY.CARD,
        value: nameMaps.card[e.args.cardId],
      },
    ],
  };

  await NFT.create(dataToCreate, {
    include: [
      {
        model: Property,
        as: 'properties',
      },
    ],
  });

  const col = await Collection.findByPk(NFT_TYPE);
  col.totalItems += 1;
  await col.save();
  await saveTotalOwner(NFT_TYPE);
};

export const handleTransfer = async event => {
  const tokenId = event.args.tokenId.toNumber();
  const nftID = getNftId(NFT_TYPE, tokenId);
  const nft = await NFT.findByPk(nftID);

  if (nft && !isBidContract(event.args.to)) {
    nft.setAttributes({ owner: event.args.to });
    await nft.save();
    await saveTotalOwner(NFT_TYPE);
  }
};

import { Event } from '@ethersproject/contracts';
import { ethers } from 'ethers';
import database from '../../../database';
import { saveTotalOwner } from '../../../utils/collection';
import { getNftId } from '../../../utils/nft';

const Property = database.models.nft_property;
const NFT = database.models.nft;
const Collection = database.models.collection;

const NFT_TYPE = 5;

const BID_CONTRACTS = ['0x77b8677c48Ff208F42010a89A4451755756f8ae7'];

function isBidContract(addr) {
  return BID_CONTRACTS.indexOf(addr) > -1;
}

const PROPERTY_KEY = {
  SIZE: 'size',
  RARITY: 'rarity',
  CARD: 'card',
  PLANET_X: 'planet_x',
  PLANET_Y: 'planet_y',
  GEM: 'gem',
  KABA: 'kaba',
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

const createCollection = async () => {
  await Collection.findOrCreate({
    where: {
      id: NFT_TYPE,
    },
    defaults: {
      id: NFT_TYPE,
      name: 'KABA Planet',
      avatar: 'https://pbs.twimg.com/profile_images/1428654572717756416/YXe-Eret_400x400.jpg',
      banner: 'https://pbs.twimg.com/profile_banners/1428654446699896833/1630293635/1500x500',
      description:
        'Kripto Galaxy Battle is a NFT blockchain based game where you can Play-to-earn. \r\nDeveloped on #KardiaChain by Cyforce Game Studio x BecoSwap',
      website: 'https://kriptobattle.com/',
      contract: '0x8FC2Cc14A4a1fcf7dACf22A1Fa05f546213cBB19',
      meta: {
        sortOptions: [
          {
            label: 'Lowest Price',
            value: 'price:asc',
          },
          {
            label: 'Highest Price',
            value: 'price:desc',
          },
          {
            label: 'Lowest ID',
            value: 'nftId:asc',
          },
          {
            label: 'Highest ID',
            value: 'nftId:desc',
          },
          {
            label: 'Recently Sold',
            value: 'soldAt:desc',
          },
          {
            label: 'Recently Listed',
            value: 'listedAt:desc',
          },
          {
            label: 'Latest',
            value: 'createdAt',
          },
        ],
      },
    },
  });
};
createCollection();

export const handleCreate = async (e: Event) => {
  const nftId = e.args.planetId.toNumber();

  const x = nftId % WIDTH;
  const y = Math.floor(nftId / WIDTH);
  const width = WIDTH / 2;
  const name = `PLANET (${x % 100}, ${Math.floor((x - width) / 100)}, ${Math.floor(
    (y - width) / 100
  )})`;
  const imageId = `${e.args.cardId + 1}-${e.args.rarity}-${nftId}`;

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
    fileUrl: `https://images.kriptogaming.com/planet/${imageId}.png`,
    thumbnail: `https://images.kriptogaming.com/planet/thumb/${imageId}.png`,
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

export const handleUpdateMetadata = async (e: Event) => {
  await handleUpdateGem(e);
  await handleUpdateKaba(e);
};

const handleUpdateGem = async (e: Event) => {
  const nftId = getNftId(NFT_TYPE, e.args._tokenId.toString());

  let property = await Property.findOne({
    where: { nftId: nftId, name: PROPERTY_KEY.GEM },
  });

  if (!property) {
    return await Property.create({
      nftId: nftId,
      name: PROPERTY_KEY.GEM,
      type: PROPERTY_TYPE.LEVEL,
      intValue: ethers.utils.formatEther(e.args.reserves.availableGem),
      maxValue: ethers.utils.formatEther(e.args.reserves.gem),
    });
  } else {
    property.intValue = ethers.utils.formatEther(e.args.reserves.availableGem);
    property.maxValue = ethers.utils.formatEther(e.args.reserves.gem);
    await property.save();
  }
};

const handleUpdateKaba = async (e: Event) => {
  const nftId = getNftId(NFT_TYPE, e.args._tokenId.toString());

  let property = await Property.findOne({
    where: { nftId: nftId, name: PROPERTY_KEY.KABA },
  });

  if (!property) {
    return await Property.create({
      nftId: nftId,
      name: PROPERTY_KEY.KABA,
      type: PROPERTY_TYPE.LEVEL,
      intValue: ethers.utils.formatEther(e.args.reserves.availableKaba),
      maxValue: ethers.utils.formatEther(e.args.reserves.kaba),
    });
  } else {
    property.intValue = ethers.utils.formatEther(e.args.reserves.availableKaba);
    property.maxValue = ethers.utils.formatEther(e.args.reserves.kaba);
    await property.save();
  }
};

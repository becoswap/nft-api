import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import { decode } from './genes';
import BigNumber from 'bignumber.js';
import { saveTotalOwner } from '../../../utils/collection';
import { Event } from 'ethers';

const Property = database.models.nft_property;
const NFT = database.models.nft;
const Collection = database.models.collection;

const bidContract = {
  '0x38375787094c984b0bf63b809F66E8C77988d1aB': true,
};

const NFT_TYPE = 4;

const cooldowns = [
  60 * 5,
  60 * 10,
  60 * 15,
  60 * 30,
  60 * 45,
  60 * 60 * 60,
  60 * 60 * 2,
  60 * 60 * 4,
  60 * 60 * 8,
  60 * 60 * 12,
  60 * 60 * 24,
  60 * 60 * 24 * 2,
  60 * 60 * 24 * 4,
  60 * 60 * 24 * 7,
];

const PROPERTY_KEY = {
  GENERATION: 'generation',
  COOLDOWNINDEX: 'cooldownIndex',
  COOLDOWN_END_BLOCK: 'cooldownEndBlock',
  SIRING_WITH_ID: 'siringWithId',
  LEVEL: 'level',
};

const PROPERTY_TYPE = {
  LEVEL: 'level',
  DEFAULT: 'property',
  STATS: 'stats',
  OTHER: 'other',
};

interface Property {
  type?: string;
  name: string;
  value?: string;
  intValue?: number;
  image?: string;
  maxValue?: number;
}

function getInfo(event) {
  const args = event.args;

  const genes = decode(new BigNumber(args.genes.toString()));

  const properties: Array<Property> = [
    {
      name: 'card',
      value: genes.card,
    },

    {
      type: 'other',
      name: 'sireId',
      intValue: args.sireId.toNumber(),
    },
    {
      type: 'other',
      name: 'matronId',
      intValue: args.matronId.toNumber(),
    },

    {
      type: 'other',
      name: 'cooldownEndBlock',
      intValue: 0,
    },
    {
      type: 'other',
      name: 'siringWithId',
      intValue: 0,
    },

    // stats
    {
      type: 'stats',
      name: 'energy',
      intValue: genes.energy,
      maxValue: 42,
    },
    {
      type: 'stats',
      name: 'speed',
      intValue: genes.speed,
      maxValue: 22,
    },
    {
      type: 'level',
      name: 'level',
      intValue: 0,
      maxValue: 10,
    },
    {
      type: 'stats',
      name: 'strength',
      intValue: genes.strength,
      maxValue: 67,
    },

    // parts
    {
      name: 'horn',
      value: genes.horn.name,
      image: genes.horn.image,
    },
    {
      name: 'head',
      value: genes.head.name,
      image: genes.head.image,
    },
    {
      name: 'eye',
      value: genes.eye.name,
      image: genes.eye.image,
    },
    {
      name: 'skill',
      value: genes.skill.name,
      image: genes.skill.image,
    },
    {
      name: 'ear',
      value: genes.ear.name,
      image: genes.ear.image,
    },
    {
      name: 'left_arm',
      value: genes.lArm.name,
      image: genes.lArm.image,
    },
    {
      name: 'right_arm',
      value: genes.rArm.name,
      image: genes.rArm.image,
    },

    {
      name: 'eye_color',
      value: genes.eye_color,
    },
    {
      name: 'head_color',
      value: genes.head_color,
    },
  ];

  if (genes.rarity != null) {
    properties.push({
      name: 'gen_0_rarity',
      value: genes.rarity,
    });
  }

  return {
    fileUrl: genes.image,
    thumbnail: genes.thumb,
    properties,
  };
}

export const handleCreate = async event => {
  const nftID = event.args.monsterId.toNumber();
  const info = getInfo(event);
  const matronId = event.args.matronId.toString();
  const sireId = event.args.sireId.toString();
  var generation = 0;
  var cooldownIndex = 0;

  if (matronId != '0') {
    const matronGeneration = await Property.findOne({
      where: {
        name: PROPERTY_KEY.GENERATION,
        nftId: getNftId(NFT_TYPE, matronId),
      },
    });

    const sireGeneration = await Property.findOne({
      where: {
        name: PROPERTY_KEY.GENERATION,
        nftId: getNftId(NFT_TYPE, sireId),
      },
    });
    generation = Number(matronGeneration.intValue);
    if (generation < Number(sireGeneration.intValue)) {
      generation = Number(sireGeneration.intValue);
    }
    generation++;
    cooldownIndex = Math.floor(generation / 2);
    if (cooldownIndex > 13) {
      cooldownIndex = 13;
    }
    await updateProperty(
      getNftId(NFT_TYPE, event.args.matronId.toString()),
      PROPERTY_KEY.SIRING_WITH_ID,
      { intValue: 0 }
    );
  }

  info.properties.push({
    type: PROPERTY_TYPE.LEVEL,
    name: PROPERTY_KEY.GENERATION,
    intValue: generation,
    maxValue: 10000,
  });
  info.properties.push({
    type: PROPERTY_TYPE.LEVEL,
    name: PROPERTY_KEY.COOLDOWNINDEX,
    intValue: cooldownIndex,
    maxValue: 13,
  });

  await NFT.create(
    {
      id: getNftId(NFT_TYPE, nftID),
      creator: event.args.owner,
      owner: event.args.owner,
      votes: 0,
      nftType: NFT_TYPE,
      nftId: nftID,
      status: 1,
      onSale: false,
      name: 'KABA Monster #' + nftID,
      ...info,
    },
    {
      include: [
        {
          model: Property,
          as: 'properties',
        },
      ],
    }
  );

  const col = await Collection.findByPk(NFT_TYPE);
  col.totalItems += 1;
  await col.save();

  await saveTotalOwner(NFT_TYPE);
};

async function updateProperty(nftId: string, name: string, attr: any) {
  await Property.update(attr, {
    where: {
      nftId: nftId,
      name: name,
    },
  });
}

export const handleTransfer = async event => {
  const tokenId = event.args.tokenId.toNumber();
  const nftID = getNftId(NFT_TYPE, tokenId);
  const nft = await NFT.findByPk(nftID);

  if (nft && !bidContract[event.args.to]) {
    nft.setAttributes({ owner: event.args.to });
    await nft.save();

    await saveTotalOwner(NFT_TYPE);
  }
};

export const handlePregnant = async event => {
  const matronId = getNftId(NFT_TYPE, event.args.matronId.toString());
  await _triggerCooldown(event, matronId);
  const sireId = getNftId(NFT_TYPE, event.args.sireId.toString());
  await _triggerCooldown(event, sireId);
};

async function _triggerCooldown(event, nftId: string) {
  let cooldownIndex = await Property.findOne({
    where: { nftId: nftId, name: PROPERTY_KEY.COOLDOWNINDEX },
  });
  const cooldownIndexValue = cooldownIndex.intValue;
  const cooldownEndBlock = Math.floor(cooldowns[cooldownIndexValue] / 5) + event.blockNumber;
  if (cooldownIndexValue < 13) {
    cooldownIndex.intValue = cooldownIndexValue + 1;
    await cooldownIndex.save();
  }

  await Property.update(
    { intValue: cooldownEndBlock },
    {
      where: { nftId: nftId, name: PROPERTY_KEY.COOLDOWN_END_BLOCK },
    }
  );
}

export const handleLevelUp = async (e: Event) => {
  const nftId = getNftId(NFT_TYPE, e.args._tokenId.toString());

  let property = await Property.findOne({
    where: { nftId: nftId, name: PROPERTY_KEY.LEVEL },
  });

  if (!property) {
    return await Property.create({
      nftId: nftId,
      name: PROPERTY_KEY.LEVEL,
      type: PROPERTY_TYPE.LEVEL,
      intValue: e.args._levelTo,
      maxValue: 10,
    });
  } else {
    property.intValue = e.args._levelTo;
    await property.save();
  }
};

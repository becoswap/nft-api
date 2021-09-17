import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import { decode } from '../../../utils/genes';
import BigNumber from 'bignumber.js';

const Property = database.models.nft_property;
const NFT = database.models.nft;

const bidContract = '0x0000000000000000000000000000000000000000';

const NFT_TYPE = 3;

const cooldowns = [
  60 * 5,
  60 * 10,
  60 * 15,
  60 * 30,
  60 * 45,
  60 * 60,
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
}

function getRobotInfo(event) {
  const args = event.args;

  const genes = decode(new BigNumber(args._genes.toString()));

  const properties: Array<Property> = [
    {
      type: 'other_string',
      name: 'card',
      value: genes.card,
    },

    {
      type: 'other_string',
      name: 'Gen0Rarity',
      value: genes.rarity,
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

    {
      type: 'stats',
      name: 'energy',
      intValue: genes.energy,
    },
    {
      type: 'stats',
      name: 'speed',
      intValue: genes.speed,
    },
    {
      type: 'stats',
      name: 'strength',
      intValue: genes.strength,
    },
    {
      name: 'anten',
      value: genes.anten.name,
      image: genes.anten.image,
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
      name: 'lShouder',
      value: genes.lShouder.name,
      image: genes.lShouder.image,
    },
    {
      name: 'rShouder',
      value: genes.rShouder.name,
      image: genes.rShouder.image,
    },
    {
      name: 'lArm',
      value: genes.lArm.name,
      image: genes.lArm.image,
    },
    {
      name: 'rArm',
      value: genes.rArm.name,
      image: genes.rArm.image,
    },

    {
      name: 'eye_color',
      type: 'other_string',
      value: genes.eye_color,
    },
    {
      name: 'head_color',
      type: 'other_string',
      value: genes.head_color,
    },
  ];

  return {
    fileUrl: genes.image,
    properties,
  };
}

export const handleCreate = async event => {
  const nftID = event.args._robotId.toNumber();
  const info = getRobotInfo(event);
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
    generation = matronGeneration.intValue;
    if (generation < sireGeneration.intValue) {
      generation = sireGeneration.intValue;
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
  });
  info.properties.push({
    type: PROPERTY_TYPE.LEVEL,
    name: PROPERTY_KEY.COOLDOWNINDEX,
    intValue: cooldownIndex,
  });

  await NFT.create(
    {
      id: getNftId(NFT_TYPE, nftID),
      creator: event.args._owner,
      owner: event.args._owner,
      votes: 0,
      nftType: NFT_TYPE,
      nftId: nftID,
      status: 1,
      onSale: false,
      name: 'KABA Robot #' + nftID,
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
  if (nft && event.args.to != bidContract) {
    nft.setAttributes({ owner: event.args.to });
    await nft.save();
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
  const cooldownEndBlock = Math.floor(cooldowns[cooldownIndex.intValue] / 5) + event.blockNumber;
  if (cooldownIndex.intValue < 13) {
    cooldownIndex.intValue += 1;
    await cooldownIndex.save();
  }

  await Property.update(
    { intValue: cooldownEndBlock },
    {
      where: { nftId: nftId, name: PROPERTY_KEY.COOLDOWN_END_BLOCK },
    }
  );
}

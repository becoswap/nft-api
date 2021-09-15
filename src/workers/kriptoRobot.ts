import { ethers } from 'ethers';
import nftContracts from '../data/kriptoRobotContracts';
import { syncContract } from '../utils/sync_contract';
import criptoRobotCoreABI from '../abi/CriptoRobotCore.json';
import { kaiWeb3 } from '../utils/web3';
import database from '../database';
import { getNftId } from '../utils/nft';
import { isBidContract } from '../utils/bidContract';
import { decode } from '../utils/genes';
import BigNumber from 'bignumber.js';
const Property = database.models.nft_property;

const zeroAddr = '0x0000000000000000000000000000000000000000';

const NFT = database.models.nft;

const cooldowns = [
  60,
  60 * 2,
  60 * 5,
  60 * 10,
  60 * 30,
  60 * 60,
  60 * 60 * 2,
  60 * 60 * 4,
  60 * 60 * 8,
  60 * 60 * 16,
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

function getRobotInfo(payload) {
  const args = payload.event.args;

  const genes = decode(new BigNumber(args._genes.toString()));

  const properties: Array<Property> = [
    {
      type: 'other_string',
      name: 'card',
      value: genes.card,
    },

    {
      type: 'other_string',
      name: 'rarity',
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

const handleCreateRobot = async args => {
  const nftID = args.event.args._robotId.toNumber();
  const info = getRobotInfo(args);
  const matronId = args.event.args.matronId.toString();
  const sireId = args.event.args.sireId.toString();
  var generation = 0;
  var cooldownIndex = 0;

  if (matronId != '0') {
    const matronGeneration = await Property.findOne({
      where: {
        name: PROPERTY_KEY.GENERATION,
        nftId: getNftId(args.id, matronId),
      },
      transaction: args.transaction,
    });

    const sireGeneration = await Property.findOne({
      where: {
        name: PROPERTY_KEY.GENERATION,
        nftId: getNftId(args.id, sireId),
      },
      transaction: args.transaction,
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
      getNftId(args.id, args.event.args.matronId.toString()),
      PROPERTY_KEY.SIRING_WITH_ID,
      { intValue: 0 },
      args.transaction
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
      id: getNftId(args.id, nftID),
      creator: args.event.args._owner,
      owner: args.event.args._owner,
      votes: 0,
      nftType: args.id,
      nftId: nftID,
      status: 1,
      onSale: false,
      name: 'KABA Robot #' + nftID,
      ...info,
    },
    {
      transaction: args.transaction,
      include: [
        {
          model: Property,
          as: 'properties',
        },
      ],
    }
  );
};

async function updateProperty(nftId: string, name: string, attr: any, t) {
  await Property.update(attr, {
    where: {
      nftId: nftId,
      name: name,
    },
    transaction: t,
  });
}

const getNft = args => {
  const robotId = args.event.args._robotId.toNumber();
  const nftID = getNftId(args.id, robotId);
  return NFT.findByPk(nftID, { transaction: args.transaction });
};

const handlerTransfer = async args => {
  const tokenId = args.event.args.tokenId.toNumber();
  const nftID = getNftId(args.id, tokenId);
  const nft = await NFT.findByPk(nftID, { transaction: args.transaction });
  if (nft && !isBidContract(args.event.args.to)) {
    nft.setAttributes({ owner: args.event.args.to });
    await nft.save({ transaction: args.transaction });
  }
};

const handleDestroy = async args => {
  const nft = await getNft(args);
  nft.setAttributes({
    owner: zeroAddr,
    creator: zeroAddr,
  });
  await nft.save({ transaction: args.transaction });
};

const handlePregnant = async args => {
  const matronId = getNftId(args.id, args.event.args.matronId.toString());
  await _triggerCooldown(args, matronId);
  const sireId = getNftId(args.id, args.event.args.sireId.toString());
  await _triggerCooldown(args, sireId);
};

async function _triggerCooldown(args, nftId: string) {
  let cooldownIndex = await Property.findOne({
    where: { nftId: nftId, name: PROPERTY_KEY.COOLDOWNINDEX },
    transaction: args.transaction,
  });
  const cooldownEndBlock =
    Math.floor(cooldowns[cooldownIndex.intValue] / 5) + args.event.blockNumber;
  if (cooldownIndex.intValue < 13) {
    cooldownIndex.intValue += 1;
    await cooldownIndex.save({ transaction: args.transaction });
  }

  await Property.update(
    { intValue: cooldownEndBlock },
    {
      where: { nftId: nftId, name: PROPERTY_KEY.COOLDOWN_END_BLOCK },
      transaction: args.transaction,
    }
  );
}

const hanlders = {
  RobotCreated: handleCreateRobot,
  Destroy: handleDestroy,
  Transfer: handlerTransfer,
  Pregnant: handlePregnant,
};

const syncNftContract = async contractInfo => {
  const contract = new ethers.Contract(contractInfo.address, criptoRobotCoreABI, kaiWeb3);
  syncContract(
    contractInfo.address,
    contractInfo.startBlock,
    async (transaction, startBlock: number, endBlock: number) => {
      const events = await contract.queryFilter({}, startBlock, endBlock);
      for (const event of events) {
        if (hanlders[event.event]) {
          await hanlders[event.event]({
            ...contractInfo,
            event: event,
            transaction: transaction,
          });
        }
      }
    }
  );
};

const run = async () => {
  for (const contractInfo of nftContracts) {
    syncNftContract(contractInfo);
  }
};

export { run };

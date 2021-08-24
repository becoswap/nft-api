import { ethers } from 'ethers';
import nftContracts from '../data/kriptoRobotContracts';
import { syncContract } from '../utils/sync_contract';
import criptoRobotCoreABI from '../abi/CriptoRobotCore.json';
import { kaiWeb3 } from '../utils/web3';
import database from '../database';
import { getNftId } from '../utils/nft';
import { isBidContract } from '../utils/bidContract';

const zeroAddr = '0x0000000000000000000000000000000000000000';

const NFT = database.models.nft;

const handleCreateRobot = async args => {
  const nftID = args.event.args._robotId.toNumber();
  const createdAt = new Date(args.event.args._createdAt.toNumber() * 1000);
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
      createdAt,
      attributes: {
        skinBase: args.event.args._skinBase.map(num => num.toString()),
        stats: args.event.args._stats.map(num => num.toString()),
        cardType: args.event.args._cardType,
        maxLevel: args.event.args._maxLevel,
        maxItem: args.event.args._maxItem,
        isActive: false,
        isCrafted: false,
        level: 1,
      },
    },
    { transaction: args.transaction }
  );
};

const handleUpgradeRobot = async args => {
  const nft = await getNft(args);
  nft.setAttributes({
    attributes: {
      ...nft.attributes,
      stats: args.event.args._newStats.map(num => num.toString()),
      level: args.event.args._newLevel,
      updatedAt: args.event.args._updatedAt.toNumber(),
    },
  });
  await nft.save({ transaction: args.transaction });
};

const getNft = args => {
  const robotId = args.event.args._robotId.toNumber();
  const nftID = getNftId(args.id, robotId);
  return NFT.findByPk(nftID, { transaction: args.transaction });
};

const handleActiveRobot = async args => {
  const nft = await getNft(args);
  nft.setAttributes({
    attributes: {
      ...nft.attributes,
      isActive: args.event.args._isActive,
      activatedAt: args.event.args._activatedAt.toNumber(),
    },
  });
  await nft.save({ transaction: args.transaction });
};

const handleCraftRobot = async args => {
  const nft = await getNft(args);
  nft.setAttributes({
    attributes: {
      ...nft.attributes,
      isCraft: args.event.args._isCraft,
      craftedAt: args.event.args._craftedAt.toNumber(),
    },
  });
  await nft.save({ transaction: args.transaction });
};

const handleEquipItem = async args => {
  const nft = await getNft(args);
  nft.setAttributes({
    attributes: {
      ...nft.attributes,
      items: args.event.args._items.map(num => num.toString()),
    },
  });
  await nft.save({ transaction: args.transaction });
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

const hanlders = {
  CreateRobot: handleCreateRobot,
  UpgradeRobot: handleUpgradeRobot,
  ActiveRobot: handleActiveRobot,
  CraftRobot: handleCraftRobot,
  EquipItem: handleEquipItem,
  Destroy: handleDestroy,
  Transfer: handlerTransfer,
};

const syncNftContract = async contractInfo => {
  syncContract(
    contractInfo.address,
    contractInfo.startBlock,
    async (transaction, startBlock: number, endBlock: number) => {
      const contract = new ethers.Contract(contractInfo.address, criptoRobotCoreABI, kaiWeb3);
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

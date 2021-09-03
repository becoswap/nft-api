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

function getRobotInfo(args) {
  const info = args.event.args._robotInfo;
  return {
    skinBase: info.skinBase.map(num => num.toString()),
    stats: info.stats.map(num => num.toString()),
    items: info.items.map(num => num.toString()),
    robotGene: info.robotGene,
    cardId: info.cardId,
    maxLevel: info.maxLevel,
    maxItem: info.maxItem,
    isCrafted: info.isCrafted,
    level: info.level,
  };
}

const handleCreateRobot = async args => {
  const nftID = args.event.args._robotId.toNumber();
  const attributes = getRobotInfo(args);
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
      attributes,
    },
    { transaction: args.transaction }
  );
};

const handleUpdateRobot = async args => {
  const nft = await getNft(args);
  const attributes = getRobotInfo(args);
  nft.setAttributes({
    attributes,
  });
  await nft.save({ transaction: args.transaction });
};

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

const hanlders = {
  CreateRobot: handleCreateRobot,
  UpdateRobot: handleUpdateRobot,
  Destroy: handleDestroy,
  Transfer: handlerTransfer,
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

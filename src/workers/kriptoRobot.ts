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

const zeroAddr = '0x0000000000000000000000000000000000000000';

const NFT = database.models.nft;

function getRobotInfo(payload) {
  const args = payload.event.args;

  const geneDecoded = decode(new BigNumber(args._genes.toString()));
  return {
    classId: geneDecoded.classId,
    skinBase: geneDecoded.skinBase,
    stats: geneDecoded.stats,
    items: [],
    genes: args._genes.toString(),
    cardId: geneDecoded.cardId,
    level: 0,
    matronId: args.matronId.toString(),
    sireId: args.sireId.toString(),
    rarity: geneDecoded.rarity,
    cooldownEndBlock: '',
    siringWithId: '',
  };
}

const handleCreateRobot = async args => {
  const nftID = args.event.args._robotId.toNumber();
  const attributes = getRobotInfo(args);
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
      attributes,
    },
    { transaction: args.transaction }
  );

  await resetCooldownEndBlock(args, args.event.args.matronId.toString());
};

const resetCooldownEndBlock = async (args, rawMatronId) => {
  return updateCooldownEndBlock(args, rawMatronId, '', '');
};

const updateCooldownEndBlock = async (args, rawMatronId, cooldownEndBlock, sireId: string) => {
  if (rawMatronId > 0) {
    const matronId = getNftId(args.id, rawMatronId);
    const matron = await NFT.findByPk(matronId, { transaction: args.transaction });
    await matron.setAttributes({
      attributes: {
        ...matron.attributes,
        cooldownEndBlock: cooldownEndBlock,
        siringWithId: sireId,
      },
    });
    await matron.save({ transaction: args.transaction });
  }
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

const handlePregnant = async args => {
  await updateCooldownEndBlock(
    args,
    args.event.args._matron.toString(),
    args.event.args.cooldownEndBlock.toString(),
    args.event.args.sireId.toString()
  );
};

const hanlders = {
  RobotCreated: handleCreateRobot,
  UpdateRobot: handleUpdateRobot,
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

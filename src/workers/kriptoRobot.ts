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
  let image: string = 'https://images.kriptogaming.com';
  if (geneDecoded.classId == 0) {
    image =
      image + `/robot/${geneDecoded.cardId}-${geneDecoded.skinBase.slice(0, 9).join('-')}.png`;
  } else {
    image =
      image + `/monster/${geneDecoded.cardId}-${geneDecoded.skinBase.slice(0, 6).join('-')}.png`;
  }

  const attributes = {
    classId: String(geneDecoded.classId),
    cardId: String(geneDecoded.cardId),
    rarity: String(geneDecoded.rarity),
    sireId: args.sireId.toString(),
    matronId: args.matronId.toString(),
    cooldownEndBlock: '0',
    siringWithId: '0',
    genes: ethers.utils.hexlify(args._genes),
    hp: String(geneDecoded.stats[0]),
    speed: String(geneDecoded.stats[1]),
    strength: String(geneDecoded.stats[2]),
    anten: String(geneDecoded.skinBase[0]),
    head: String(geneDecoded.skinBase[1]),
    eye: String(geneDecoded.skinBase[2]),
    lShouder: String(geneDecoded.skinBase[3]),
    rShouder: String(geneDecoded.skinBase[4]),
    lArm: String(geneDecoded.skinBase[5]),
    rArm: String(geneDecoded.skinBase[6]),
    lHand: String(geneDecoded.skinBase[7]),
    rHand: String(geneDecoded.skinBase[8]),
    mouth: String(geneDecoded.skinBase[3]),
    hand: String(geneDecoded.skinBase[4]),
    arm: String(geneDecoded.skinBase[5]),
  };

  return {
    fileUrl: image,
    attributes,
  };
}

const handleCreateRobot = async args => {
  const nftID = args.event.args._robotId.toNumber();
  const info = getRobotInfo(args);
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
      ...info,
    },
    { transaction: args.transaction }
  );

  if (args.event.args.matronId.toString() != '0') {
    const matronId = getNftId(args.id, args.event.args.matronId.toString());
    const matron = await NFT.findByPk(matronId, { transaction: args.transaction });
    matron.attributes.siringWithId = '0';
    await matron.save({ transaction: args.transaction });
  }
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
  const matronId = getNftId(args.id, args.event.args.matronId.toString());
  const matron = await NFT.findByPk(matronId, { transaction: args.transaction });
  matron.attributes.cooldownEndBlock = args.event.args.cooldownEndBlock.toString();
  matron.attributes.siringWithId = args.event.args.siringWithId.toString();

  const sireId = getNftId(args.id, args.event.args.sireId.toString());
  const sire = await NFT.findByPk(sireId, { transaction: args.transaction });
  sire.attributes.cooldownEndBlock = args.event.args.cooldownEndBlock.toString();

  await matron.save({ transaction: args.transaction });
  await sire.save({ transaction: args.transaction });
};

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

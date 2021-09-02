import { ethers, Event } from 'ethers';
import nftContracts from '../data/nftContracts';
import { kaiWeb3 } from '../utils/web3';
import voteNFTABI from '../abi/VoteNFT.json';
import BigNumber from 'bignumber.js';

import database from '../database';
import { getNftId } from '../utils/nft';
import voteNFTContracts from '../data/voteNFTContracts';

import { syncContract } from '../utils/sync_contract';

const nftByAddr = {};
nftContracts.forEach(nft => {
  nftByAddr[nft.address] = nft;
});

const NFT = database.models.nft;
const Vote = database.models.vote;

export const BIG_TEN = new BigNumber(10);

const handleVote = async (e: Event, transaction) => {
  const nft = nftByAddr[e.args.nft];
  if (!nft) return;

  let votes = new BigNumber(e.args.votes.toString()).div(BIG_TEN.pow(18)).toNumber();
  votes = Math.floor(votes);
  const nftId = getNftId(nft.id, e.args.tokenId);
  const nftRecord: any = await NFT.findByPk(nftId, { transaction });
  if (!nftRecord) throw Error('nft not found');

  const vote: any = await Vote.findOne({
    where: {
      nftType: nft.id,
      nftId: e.args.tokenId,
      voter: e.args.voter,
    },
    transaction,
  });

  if (!vote) {
    await Vote.create(
      {
        nftType: nft.id,
        nftId: e.args.tokenId,
        voter: e.args.voter,
        votes: votes,
      },
      { transaction }
    );
  } else {
    vote.setAttributes({
      votes: vote.votes + votes,
    });
    await vote.save({ transaction });
  }

  const sumVote = await Vote.sum('votes', {
    where: {
      nftType: nft.id,
      nftId: e.args.tokenId,
    },
    transaction,
  });

  nftRecord.setAttributes({ votes: sumVote });
  return await nftRecord.save({ transaction });
};

const startSync = async contractInfo => {
  const contract = new ethers.Contract(contractInfo.address, voteNFTABI, kaiWeb3);
  syncContract(
    contractInfo.address,
    contractInfo.startBlock,
    async (transaction, startBlock: number, endBlock: number) => {
      const events = await contract.queryFilter(contract.filters.Voted(), startBlock, endBlock);
      for (const e of events) {
        await handleVote(e, transaction);
      }
    }
  );
};

const run = async () => {
  for (const contractInfo of voteNFTContracts) {
    startSync(contractInfo);
  }
};

export { run };

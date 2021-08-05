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

  const votes = new BigNumber(e.args.votes.toString()).div(BIG_TEN.pow(18)).toNumber();

  const nftId = getNftId(nft.id, e.args.tokenId);
  const nftRecord: any = await NFT.findByPk(nftId);
  if (!nftRecord) return;

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

    nftRecord.setAttributes({ votes: votes });
  } else {
    vote.setAttributes({
      votes: vote.votes + votes,
    });
    await vote.save({ transaction });
    nftRecord.setAttributes({ votes: votes + nftRecord.votes });
  }

  return await nftRecord.save({ transaction });
};

const startSync = async contractInfo => {
  syncContract(
    contractInfo.address,
    contractInfo.startBlock,
    async (transaction, startBlock: number, endBlock: number) => {
      const contract = new ethers.Contract(contractInfo.address, voteNFTABI, kaiWeb3);
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

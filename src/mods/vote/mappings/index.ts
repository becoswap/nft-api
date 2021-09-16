import { Event } from 'ethers';
import BigNumber from 'bignumber.js';

import database from '../../../database';
import { getNftId } from '../../../utils/nft';

const NFT = database.models.nft;
const Vote = database.models.vote;

const bidType = {
  artwork: '0x8b913D0828Fc1eFCaed8D6e1E5292D3A024A2Db1',
};

const NFT_TYPES = {
  [bidType.artwork]: 2,
};

export const BIG_TEN = new BigNumber(10);

const loadNft = async (id: string) => {
  const nft = await NFT.findByPk(id);
  if (!nft) {
    throw Error('nft not found');
  }
  return nft;
};

export const handleVote = async (event: Event) => {
  if (!NFT_TYPES[event.args.nft]) return;

  let votes = new BigNumber(event.args.votes.toString()).div(BIG_TEN.pow(18)).toNumber();
  votes = Math.floor(votes);
  const nftId = getNftId(NFT_TYPES[event.args.nft], event.args.tokenId);
  const nft = await loadNft(nftId);

  const vote: any = await Vote.findOne({
    where: {
      nftId: nftId,
      voter: event.args.voter,
    },
  });

  if (!vote) {
    await Vote.create({
      nftId: nftId,
      voter: event.args.voter,
      votes: votes,
    });
  } else {
    vote.setAttributes({
      votes: vote.votes + votes,
    });
    await vote.save();
  }

  const sumVote = await Vote.sum('votes', {
    where: {
      nftType: nft.id,
      nftId: event.args.tokenId,
    },
  });

  nft.setAttributes({ votes: sumVote });
  await nft.save();
};

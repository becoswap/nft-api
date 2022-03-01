import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import md5 from 'blueimp-md5';
import BigNumber from 'bignumber.js';
import { Event } from '@ethersproject/contracts';
import { getBlock } from '../../../utils/web3';

const Event = database.models.event;
const Nft = database.models.nft;
const Bid = database.models.bid;
const Collection = database.models.collection;

const bidType = {
  artwork: '0x8b913D0828Fc1eFCaed8D6e1E5292D3A024A2Db1',
  kaba: '0xd504F8A8975527689E9c8727CA37a0FFCD1351cF',
  kabaKai: '0x936EC122D6F0e204aCA2E0eab2394d7305fbB6f8',
  kabaMonster: '0x38375787094c984b0bf63b809F66E8C77988d1aB',
  kabaPlanet: '0x77b8677c48Ff208F42010a89A4451755756f8ae7',
  kns: '0x7b38965EBD0E2AeD846FFF9B4147b806a7Ef9Ea9',
  the300: "0xc2317e78E920343741C5031245c20F44B2D4c2db"
};

const beco = '0x2Eddba8b949048861d2272068A94792275A51658';

const NFT_TYPES = {
  [bidType.artwork]: 2,
  [bidType.kaba]: 3,
  [bidType.kabaKai]: 3,
  [bidType.kabaMonster]: 4,
  [bidType.kabaPlanet]: 5,
  [bidType.kns]: 6,
  [bidType.the300]: 7
};

const QUOTE_ADDRESSES = {
  [bidType.artwork]: beco,
  [bidType.kaba]: beco,
  [bidType.kabaKai]: '',
  [bidType.kabaMonster]: '',
  [bidType.kabaPlanet]: '',
  [bidType.kns]: '',
  [bidType.the300]: ''
};

function getBidId(event) {
  const args = event.args;
  const nftId = args.tokenId.toString();
  return md5([nftId, NFT_TYPES[event.address], args.bidder].join(''));
}

const upsertBid = async event => {
  const args = event.args;
  const nftId = args.tokenId.toString();
  const id = getBidId(event);
  await Bid.upsert({
    id: id,
    nftId: getNftId(NFT_TYPES[event.address], nftId),
    bidder: args.bidder,
    address: event.address,
    price: args.price.toString(),
  });
};

const removeBid = async (event, buyer) => {
  const args = event.args;
  const nftId = args.tokenId.toString();
  const id = md5([nftId, NFT_TYPES[event.address], buyer].join(''));
  await Bid.destroy({
    where: {
      id: id,
    },
  });
};

async function createEvent(event, metadata) {
  const tx = await event.getTransaction();
  const block = await getBlock(event.blockNumber);
  const createdAt = new Date(block.timestamp * 1000);
  const nftID = getNftId(NFT_TYPES[event.address], event.args.tokenId.toString());
  await Event.create({
    txHash: event.transactionHash,
    nftId: nftID,
    address: event.address,
    from: tx.from,
    to: tx.to,
    event: event.event,
    metadata: metadata,
    createdAt: createdAt,
  });
}

const loadNft = async (id: string) => {
  const nft = await Nft.findByPk(id);
  if (!nft) {
    throw Error('nft not found');
  }
  return nft;
};

export async function handleTrade(event: Event) {
  const block = await getBlock(event.blockNumber);
  const createdAt = new Date(block.timestamp * 1000);

  await createEvent(event, {
    seller: event.args.seller,
    buyer: event.args.buyer,
    price: event.args.price.toString(),
    fee: event.args.fee.toString(),
  });

  const nftID = getNftId(NFT_TYPES[event.address], event.args.tokenId.toString());
  const nft = await loadNft(nftID);
  nft.setAttributes({
    owner: event.args.buyer,
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: 0,
    soldAt: createdAt,
    listedAt: null,
  });

  await nft.save();
  await removeBid(event, event.args.buyer);

  const col = await Collection.findByPk(NFT_TYPES[event.address]);
  const tradePrice = new BigNumber(event.args.price.toString());
  const totalVolume = new BigNumber(col.totalVolume);
  col.totalVolume = totalVolume.plus(tradePrice).toString();
  await col.save();
}

export async function handleAsk(event) {
  const block = await getBlock(event.blockNumber);
  const createdAt = new Date(block.timestamp * 1000);

  await createEvent(event, {
    price: event.args.price.toString(),
  });

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toString());
  const nft = await loadNft(nftId);
  nft.setAttributes({
    price: event.args.price.toString(),
    exchangeAddress: event.address,
    quoteToken: QUOTE_ADDRESSES[event.address],
    onSale: true,
    listedAt: createdAt,
  });
  await nft.save();
}

export async function handleCancelSellToken(event) {
  await createEvent(event, {});

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toString());
  const nft = await loadNft(nftId);
  nft.setAttributes({
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: 0,
    listedAt: null,
  });
  await nft.save();
}

export async function handleBid(event) {
  await createEvent(event, {
    bidder: event.args.bidder,
    price: event.args.price.toString(),
  });

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toString());
  const nft = await loadNft(nftId);
  nft.setAttributes({
    auctionPrice: event.args.price.toString(),
  });
  await nft.save();

  await upsertBid(event);
}

export async function handleCancelBidToken(event) {
  await createEvent(event, {
    bidder: event.args.bidder,
  });
  await removeBid(event, event.args.bidder);
}

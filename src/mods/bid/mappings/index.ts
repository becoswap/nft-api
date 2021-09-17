import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import md5 from 'blueimp-md5';

const Event = database.models.event;
const Nft = database.models.nft;
const Bid = database.models.bid;

const bidType = {
  artwork: '0x8b913D0828Fc1eFCaed8D6e1E5292D3A024A2Db1',
};

const beco = '0x2Eddba8b949048861d2272068A94792275A51658';

const NFT_TYPES = {
  [bidType.artwork]: 2,
};

const QUOTE_ADDRESSES = {
  [bidType.artwork]: beco,
};

function getBidId(event) {
  const args = event.args;
  const nftId = args.tokenId.toNumber();
  return md5([nftId, NFT_TYPES[event.address], args.bidder].join(''));
}

const upsertBid = async event => {
  const args = event.args;
  const nftId = args.tokenId.toNumber();
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
  const nftId = args.tokenId.toNumber();
  const id = md5([nftId, NFT_TYPES[event.address], buyer].join(''));
  await Bid.destroy({
    where: {
      id: id,
    },
  });
};

async function createEvent(event, metadata) {
  const tx = await event.getTransaction();
  const block = await event.getBlock();
  const createdAt = new Date(block.timestamp * 1000);
  const nftID = getNftId(NFT_TYPES[event.address], event.args.tokenId.toNumber());
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

export async function handleTrade(event) {
  await createEvent(event, {
    seller: event.args.seller,
    buyer: event.args.buyer,
    price: event.args.price.toString(),
    fee: event.args.fee.toString(),
  });

  const nftID = getNftId(NFT_TYPES[event.address], event.args.tokenId.toNumber());
  const nft = await loadNft(nftID);
  nft.setAttributes({
    owner: event.args.buyer,
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: '',
  });

  await nft.save();
  await removeBid(event, event.args.buyer);
}

export async function handleAsk(event) {
  await createEvent(event, {
    price: event.args.price.toString(),
  });

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toNumber());
  const nft = await loadNft(nftId);
  nft.setAttributes({
    price: event.args.price.toString(),
    exchangeAddress: event.address,
    quoteToken: QUOTE_ADDRESSES[event.address],
    onSale: true,
  });
  await nft.save();
}

export async function handleCancelSellToken(event) {
  await createEvent(event, {});

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toNumber());
  const nft = await loadNft(nftId);
  nft.setAttributes({
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: '',
  });
  await nft.save();
}

export async function handleBid(event) {
  await createEvent(event, {
    bidder: event.args.bidder,
    price: event.args.price.toString(),
  });

  const nftId = getNftId(NFT_TYPES[event.address], event.args.tokenId.toNumber());
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

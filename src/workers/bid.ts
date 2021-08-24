import { ethers } from 'ethers';
import exchangeContracts from '../data/exchangeContracts';
import bidABI from '../abi/bid.json';
import { kaiWeb3 } from '../utils/web3';
import database from '../database';
import { getNftId } from '../utils/nft';
import { syncContract } from '../utils/sync_contract';
const Event = database.models.event;
const Nft = database.models.nft;

interface Payload {
  event: any;
  bid: any;
}

async function createEvent(payload: Payload, metadata, transaction) {
  const event = payload.event;
  const tx = await event.getTransaction();
  const block = await event.getBlock();
  const createdAt = new Date(block.timestamp * 1000);
  await Event.create(
    {
      txHash: event.transactionHash,
      nftAddress: payload.bid.nftAddress,
      nftId: event.args.tokenId.toNumber(),
      address: event.address,
      from: tx.from,
      to: tx.to,
      event: event.event,
      metadata: metadata,
      createdAt: createdAt,
    },
    { transaction }
  );
}

async function handleTrade(payload: Payload, transaction) {
  const event = payload.event;
  await createEvent(
    payload,
    {
      seller: event.args.seller,
      buyer: event.args.buyer,
      price: event.args.price.toString(),
      fee: event.args.fee.toString(),
    },
    transaction
  );

  const nftId = getNftId(payload.bid.nftId, event.args.tokenId.toNumber());
  const nft = await Nft.findByPk(nftId, { transaction });
  if (!nft) {
    throw Error('nft not found');
  }
  nft.setAttributes({
    owner: event.args.buyer,
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: '',
  });
  await nft.save({ transaction: transaction });
}

async function handleAsk(payload: Payload, transaction) {
  await createEvent(
    payload,
    {
      price: payload.event.args.price.toString(),
    },
    transaction
  );

  const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber());
  const nft = await Nft.findByPk(nftId, { transaction: transaction });
  if (!nft) {
    throw Error('nft not found');
  }
  nft.setAttributes({
    price: payload.event.args.price.toString(),
    exchangeAddress: payload.bid.address,
    quoteToken: payload.bid.quoteAddress,
    onSale: true,
  });
  await nft.save({ transaction: transaction });
}

async function handleCancelSellToken(payload: Payload, transaction) {
  await createEvent(payload, {}, transaction);

  const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber());
  const nft = await Nft.findByPk(nftId, { transaction: transaction });
  if (!nft) {
    throw Error('nft not found');
  }
  nft.setAttributes({
    exchangeAddress: '',
    quoteToken: '',
    onSale: false,
    price: '',
  });
  await nft.save({ transaction: transaction });
}

async function handleBid(payload: Payload, transaction) {
  const event = payload.event;
  await createEvent(
    payload,
    {
      bidder: event.args.bidder,
      price: event.args.price.toString(),
    },
    transaction
  );

  const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber());
  const nft = await Nft.findByPk(nftId, { transaction: transaction });
  if (!nft) {
    throw Error('nft not found');
  }
  nft.setAttributes({
    auctionPrice: event.args.price.toString(),
  });
  await nft.save({ transaction: transaction });
}

async function handleCancelBidToken(payload: Payload, transaction) {
  const event = payload.event;
  await createEvent(
    payload,
    {
      bidder: event.args.bidder,
    },
    transaction
  );
}

const handlers = {
  Trade: handleTrade,
  Ask: handleAsk,
  Bid: handleBid,
  CancelBidToken: handleCancelBidToken,
  CancelSellToken: handleCancelSellToken,
};

const syncBidContract = async data => {
  syncContract(data.address, data.startBlock, async (t, fromBlock, toBlock) => {
    const contract = new ethers.Contract(data.address, bidABI, kaiWeb3);
    const events = await contract.queryFilter({}, fromBlock, toBlock);
    for (const event of events) {
      if (handlers[event.event]) {
        await handlers[event.event](
          {
            event: event,
            bid: data,
          },
          t
        );
      }
    }
  });
};

const run = async () => {
  for (const c of exchangeContracts) {
    syncBidContract(c);
  }
};

export { run };

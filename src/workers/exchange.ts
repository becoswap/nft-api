import { ethers } from "ethers"
import exchangeContracts from "../data/exchangeContracts"
import bidABI from "../abi/bid.json";
import { kaiWeb3 } from "../utils/web3";
import database from "../database"
import nftContracts from "../data/nftContracts";
import { getNftId } from "../utils/nft";
import { syncContract } from "../utils/sync_contract";
const Event = database.models.event;
const Nft = database.models.nft;

const nftContractByAddr = {}
nftContracts.forEach(nft => {
    nftContractByAddr[nft.address] = nft;
})

interface Payload {
    event: any
    bid: any
}

async function createEvent(payload: Payload, metadata, transaction) {
    const event = payload.event;
    const tx = await event.getTransaction()
    await Event.create({
        txHash: event.transactionHash,
        nftAddress: payload.bid.nftAddress,
        nftId: event.args.tokenId.toNumber(),
        address: event.address,
        from: tx.from,
        to: tx.to,
        event: event.event,
        metadata: metadata,
    }, { transaction })
}

async function handleTrade(payload: Payload, transaction) {
    const event = payload.event;
    await createEvent(payload, {
        seller: event.args.seller,
        buyer: event.args.buyer,
        price: event.args.price.toString(),
        fee: event.args.fee.toString(),
    }, transaction)

    const nftId = getNftId(payload.bid.nftId, event.args.tokenId.toNumber())
    const nft = await Nft.findByPk(nftId)
    nft.setAttributes({
        owner: event.args.buyer,
        exchangeAddress: "",
        quoteToken: "",
        onSale: true,
        price: ""
    })
    await nft.save({ transaction: transaction})
}

async function handleAsk(payload: Payload, transaction) {
    await createEvent(payload, {
        price: payload.event.args.price.toString(),
    }, transaction)

    const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber())
    const nft = await Nft.findByPk(nftId)
    nft.setAttributes({
        price: payload.event.args.price.toString(),
        exchangeAddress: payload.bid.address,
        quoteToken: payload.bid.quoteAddress,
        onSale: true
    })
    await nft.save({ transaction: transaction})
}

async function handleCancelSellToken(payload: Payload, transaction) {
    await createEvent(payload, {
        price: payload.event.args.price.toString(),
    }, transaction)

    const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber())
    const nft = await Nft.findByPk(nftId)
    nft.setAttributes({
        exchangeAddress: "",
        quoteToken: "",
        onSale: false,
        price: ""
    })
    await nft.save({ transaction: transaction})
}

async function handleBid(payload: Payload, transaction) {
    const event = payload.event;
    await createEvent(payload, {
        bidder: event.args.bidder,
        price: event.args.price.toString(),
    }, transaction)

    const nftId = getNftId(payload.bid.nftId, payload.event.args.tokenId.toNumber())
    const nft = await Nft.findByPk(nftId)
    nft.setAttributes({
        auctionPrice: event.args.price.toString()
    })
    await nft.save({ transaction: transaction})
}

async function handleCancelBidToken(payload: Payload, transaction) {
    const event = payload.event;
    await createEvent(payload, {
        bidder: event.args.bidder,
    }, transaction)
}

const EVENT_NAMES = [
    "Trade",
    "Ask",
    "CancelSellToken",
    "Bid",
    "CancelBidToken"
]

const handlers = {
    Trade: handleTrade,
    Ask: handleAsk,
    Bid: handleBid,
    CancelBidToken: handleCancelBidToken,
    CancelSellToken: handleCancelSellToken,
}

const syncBidContract = async (data) => {
    syncContract(data.address, data.startBlock, async (t, fromBlock, toBlock) => {
        const contract = new ethers.Contract(data.address, bidABI, kaiWeb3)
        for (const eventName of EVENT_NAMES) {
            const events = await contract.queryFilter(contract.filters[eventName](), fromBlock, toBlock)
            for (const event of events) {
                await handlers[eventName]({
                    event: event,
                    bid: data,
                }, t)
            }
        }
    })
}


const run = async () => {
    for (const c of exchangeContracts) {
        syncBidContract(c);
    }
}

export {
    run
}
import { ethers } from "ethers"
import nftContracts from "../data/nftContracts"
import { kaiWeb3 } from "../utils/web3"
import erc721DuyABI  from "../abi/erc721-duy.json"
import erc721ABI  from "../abi/erc721.json"

import database from "../database";
import { getNftId } from "../utils/nft";
import exchangeContracts from "../data/exchangeContracts";
import { syncContract } from "../utils/sync_contract";

function getErc721Abi(erctype) {
    if (erctype == "erc721-duy") {
        return erc721DuyABI
    } else {
        return erc721ABI
    }
}

const exchangeContractByNft = {}
exchangeContracts.forEach(c => {
    exchangeContractByNft[c.nftId] = c;
})

const NFT = database.models.nft;
const SyncStatus = database.models.sync_status;

interface Payload {
    nftType: number;
    tokenId: number;
    from: string;
    to: string;
    status: number
}

const handlerTransfer = async (payload: Payload, transaction) => {

    let nftData: any = {
        id: getNftId(payload.nftType, payload.tokenId),
        nftType: payload.nftType,
        nftId: payload.tokenId,
        status: payload.status,
        onSale: false
    }

    if (payload.from == "0x0000000000000000000000000000000000000000") {
        nftData.creator = payload.to;
    }

    const eContract  = exchangeContractByNft[payload.to];
    if (!eContract) {
        nftData.owner = payload.to;
    } else {
        nftData.exchangeAddress = eContract.address;
        nftData.quoteToken = eContract.quoteAddress;
    }

    const nft = await NFT.findByPk(nftData.id)
    if (!nft) {
        return await NFT.create(nftData, {transaction: transaction})
    }
    nft.set("owner", nftData.onwer)
    await nft.save({ transaction: transaction });
}

const syncNftContract = async (contractInfo) => {
    syncContract(contractInfo.address, contractInfo.startBlock, async (transaction, startBlock: number, endBlock: number) => {
        const contract = new ethers.Contract(contractInfo.address, getErc721Abi(contractInfo.erc721type), kaiWeb3)
        const events = await contract.queryFilter(contract.filters.Transfer(), startBlock, endBlock)
        for (const event of events) {
            await handlerTransfer({
                nftType: contractInfo.id,
                tokenId: event.args._tokenId.toNumber(),
                from: event.args._from,
                to: event.args._to,
                status: contractInfo.neededVerify ? 0: 1,
            }, transaction)
        }
    })
}


const run = async () => {
    for (const contractInfo of nftContracts) {
        syncNftContract(contractInfo);
    }
}


export {
    run
}
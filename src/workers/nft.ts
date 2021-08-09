import { ethers } from 'ethers';
import nftContracts from '../data/nftContracts';
import { kaiWeb3 } from '../utils/web3';
import erc721DuyABI from '../abi/erc721-duy.json';
import erc721ABI from '../abi/erc721.json';

import database from '../database';
import { getNftId } from '../utils/nft';
import exchangeContracts from '../data/exchangeContracts';
import { syncContract } from '../utils/sync_contract';

const zeroAddr = '0x0000000000000000000000000000000000000000';
const ArtworkBaseURI = 'https://api-nfts.becoswap.com/artworks/';

function getErc721Abi(erctype) {
  if (erctype == 'erc721-duy') {
    return erc721DuyABI;
  } else {
    return erc721ABI;
  }
}

const bidByAddr = {};
exchangeContracts.forEach(c => {
  bidByAddr[c.address] = c;
});

const NFT = database.models.nft;
const Artwork = database.models.artwork;

interface Payload {
  nftType: number;
  tokenId: number;
  from: string;
  to: string;
  status: number;
  contractAddress: string;
}

async function useTokenMeta(nft, contractAddr, tokenId) {
  try {
    const contract = new ethers.Contract(contractAddr, erc721ABI, kaiWeb3);
    const tokenURI = await contract.tokenURI(tokenId);
    if (tokenURI && tokenURI.includes(ArtworkBaseURI)) {
      const artworkID = tokenURI.replace(ArtworkBaseURI, '');
      const artwork: any = await Artwork.findByPk(artworkID);
      if (artwork) {
        nft.name = artwork.name;
        nft.description = artwork.description;
        nft.attributes = artwork.meta;
        nft.fileUrl = artwork.fileUrl;
        nft.tokenUrl = tokenURI;
      }
    }
  } catch (err) {
    console.error('get nft token err', err);
  }
}

const handleTransfer = async (payload: Payload, transaction) => {
  let nftData: any = {
    id: getNftId(payload.nftType, payload.tokenId),
    nftType: payload.nftType,
    nftId: payload.tokenId,
    status: payload.status,
    onSale: false,
    votes: 0,
  };

  if (payload.from == zeroAddr) {
    nftData.creator = payload.to;
    if (payload.nftType != 1) {
      await useTokenMeta(nftData, payload.contractAddress, payload.tokenId);
    }
  }

  const eContract = bidByAddr[payload.to];
  if (!eContract) {
    nftData.owner = payload.to;
  } else {
    nftData.exchangeAddress = eContract.address;
    nftData.quoteToken = eContract.quoteAddress;
  }
  const nft = await NFT.findByPk(nftData.id, { transaction: transaction });
  if (!nft) {
    return await NFT.create(nftData, { transaction: transaction });
  }

  let dataToUpdate = {
    owner: nftData.owner,
  };
  if (payload.nftType != 1 && !nft.tokenUrl) {
    await useTokenMeta(dataToUpdate, payload.contractAddress, payload.tokenId);
  }

  nft.setAttributes(dataToUpdate);
  await nft.save({ transaction: transaction });
};

const syncNftContract = async contractInfo => {
  syncContract(
    contractInfo.address,
    contractInfo.startBlock,
    async (transaction, startBlock: number, endBlock: number) => {
      const contract = new ethers.Contract(
        contractInfo.address,
        getErc721Abi(contractInfo.erc721type),
        kaiWeb3
      );
      const events = await contract.queryFilter(contract.filters.Transfer(), startBlock, endBlock);
      for (const event of events) {
        await handleTransfer(
          {
            nftType: contractInfo.id,
            contractAddress: contractInfo.address,
            tokenId: event.args._tokenId.toNumber(),
            from: event.args._from,
            to: event.args._to,
            status: contractInfo.neededVerify ? 0 : 1,
          },
          transaction
        );
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

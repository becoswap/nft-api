import { ethers, Event } from 'ethers';
import erc721ABI from '../abis/erc721.json';

import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import { kaiWeb3 } from '../../../utils/web3';

const zeroAddr = '0x0000000000000000000000000000000000000000';
const ArtworkBaseURI = 'https://api-nfts.becoswap.com/artworks/';

const NFT = database.models.nft;
const Artwork = database.models.artwork;

const beco = '0x2Eddba8b949048861d2272068A94792275A51658';

const bid = {
  '0x8b913D0828Fc1eFCaed8D6e1E5292D3A024A2Db1': {
    quote: beco,
  },
};

const NFT_TYPES = {
  '0x33144EC3a462b944503549179e6635B2492061F6': 2,
};

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
    if (err.code == 'CALL_EXCEPTION') {
      console.error('get nft token: ', contractAddr, ', tokenid: ', tokenId, err.code);
      return;
    }
    throw err;
  }
}

export const handleTransfer = async (event: Event) => {
  let nftData: any = {
    id: getNftId(NFT_TYPES[event.address], event.args._tokenId.toNumber()),
    nftType: NFT_TYPES[event.address],
    nftId: event.args._tokenId.toNumber(),
    status: 0,
    onSale: false,
    votes: 0,
  };

  if (event.args._from == zeroAddr) {
    nftData.creator = event.args._to;
    await useTokenMeta(nftData, event.address, event.args._tokenId.toNumber());
  }

  const bidConfig = bid[event.args._to];
  if (!bidConfig) {
    nftData.owner = event.args._to;
  } else {
    nftData.exchangeAddress = event.args._to;
    nftData.quoteToken = bidConfig.quote;
  }
  const nft = await NFT.findByPk(nftData.id);
  if (!nft) {
    return await NFT.create(nftData);
  }

  let dataToUpdate: any = {
    owner: nftData.owner,
  };

  // burn
  if (event.args._to == zeroAddr) {
    dataToUpdate.creator = zeroAddr;
    dataToUpdate.owner = zeroAddr;
  }

  nft.setAttributes(dataToUpdate);
  await nft.save();
};

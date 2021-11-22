import { Event } from "@ethersproject/contracts";
import { ethers } from "ethers";
import database from '../../../database';
import { saveTotalOwner } from "../../../utils/collection";
import { getNftId } from "../../../utils/nft";
import { kaiWeb3 } from "../../../utils/web3";
import KNS_ABI from '../abis/kns.json'
import tokenIdToDomain from "../utils/tokenIdToDomain";


const NFT = database.models.nft;
const Propery = database.models.nft_property;
const COLLECTION_ID = 6;
const Collection = database.models.collection;

const include = [
    {
        model: Propery,
        as: "properties"
    }
]

const BID_CONTRACTS = ['0x7b38965EBD0E2AeD846FFF9B4147b806a7Ef9Ea9'];

function isBidContract(addr) {
  return BID_CONTRACTS.indexOf(addr) > -1;
}

export const createCollection = async () => {
    await Collection.findOrCreate({
      where: {
        id: COLLECTION_ID,
      },
      defaults: {
        id: COLLECTION_ID,
        name: 'KNS (KardiaChain Name Service)',
        avatar: 'https://pbs.twimg.com/profile_images/1430513357749170177/fXXLXo2U_400x400.jpg',
        banner: 'https://pbs.twimg.com/profile_banners/1430512790570217472/1629952741/1500x500',
        description:
          `KNS (Kardiachain Name Service) is a decentralized Domain Name Service on KardiaChain $KAI. Built by 
          @OdinDAO
           🛡️⚔️`,
        website: 'https://kns.domains/',
        contract: '0x72Beb962D94d4807F7217285Da21dAFDE2F97cb4',
        meta: {
          sortOptions: [
            {
              label: 'Lowest Price',
              value: 'price:asc',
            },
            {
              label: 'Highest Price',
              value: 'price:desc',
            },
            {
              label: 'Lowest ID',
              value: 'nftId:asc',
            },
            {
              label: 'Highest ID',
              value: 'nftId:desc',
            },
            {
              label: 'Recently Sold',
              value: 'soldAt:desc',
            },
            {
              label: 'Recently Listed',
              value: 'listedAt:desc',
            },
            {
              label: 'Latest',
              value: 'createdAt',
            },
          ],
        },
      },
    });
};

createCollection();

export async function handleTransfer(e: Event) {
    const tokenId = e.args.tokenId.toString();
    const nftId = getNftId(COLLECTION_ID, tokenId);

    

    const nft = await NFT.findByPk(nftId, {
        include
    })

    if (!nft) {
        const contract = new ethers.Contract(e.address, KNS_ABI, kaiWeb3)
        const domain = await contract.domains(e.args.tokenId, {
            blockTag: e.blockNumber
        })
        const name = tokenIdToDomain(String(tokenId)) + ".kai";
        const dataToCreate = {
            id: nftId,
            nftType: COLLECTION_ID,
            nftId: tokenId,
            creator: e.args.to,
            owner: e.args.to,
            votes: 0,
            status: 1,
            onSale: false,
            fileUrl: `https://nft-images.becoswap.com/images/text/${name}`,
            name: tokenIdToDomain(String(tokenId)),
            properties: [
                {
                    name: "expires_at",
                    intValue: domain.expiresAt.toNumber(),
                    type: "stats"
                }
            ]
        }

        await NFT.create({
            ...dataToCreate,
        }, {include})

        await saveTotalOwner(COLLECTION_ID);

    } else if (!isBidContract(e.args.to)){
        nft.owner = e.args.to;
        await nft.save();

        await saveTotalOwner(COLLECTION_ID);

    }

}
export async function handleRenew(e: Event) {
    const tokenId = e.args.tokenId.toString();
    const nftId = getNftId(COLLECTION_ID, tokenId);
    const nft = await NFT.findByPk(nftId, {
        include
    })

    nft.properties = [
        {
            name: "expires_at",
            intValue: e.args.expiresAt.toNumber(),
            type: "stats"
        }
    ]

    await nft.save();
}
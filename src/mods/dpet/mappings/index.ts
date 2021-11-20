import { Event } from 'ethers';
import database from '../../../database';
import { getNftId } from '../../../utils/nft';
import { fetchPet, isBidContract } from './util';

const zeroAddr = '0x0000000000000000000000000000000000000000';
const COLLECTION_ID = 1;
const NFT = database.models.nft;
const Property = database.models.nft_property;
const Message = database.models.message;

async function getPetInfo(tokenId: number) {
  const pet = await fetchPet(tokenId);

  const properties: any = [
    {
      name: 'generation',
      type: 'level',
      intValue: pet.Common.Generation,
    },
    {
      name: 'stage',
      type: 'level',
      intValue: pet.Common.Stage,
    },
    {
      name: 'level',
      type: 'level',
      intValue: pet.Common.Level,
    },
    {
      name: 'matronId',
      type: 'other',
      intValue: pet.Common.MatronId,
    },
    {
      name: 'sireId',
      type: 'other',
      intValue: pet.Common.SireId,
    },
    {
      name: 'element',
      value: pet.Display.Element,
    },
  ];

  for (let partKey in pet.Display.Parts) {
    properties.push({
      name: partKey,
      value: pet.Display.Parts[partKey].PartName,
      image: pet.Display.Parts[partKey].PartImage,
    });
  }

  delete pet.Stat.SilverPerSec;
  delete pet.Stat.FoodPerSec;
  delete pet.Stat.Level;
  for (let statsKey in pet.Stat) {
    properties.push({
      name: statsKey,
      intValue: pet.Stat[statsKey],
      type: 'stats',
    });
  }

  return {
    fileUrl: pet.Display[`Stage${pet.Common.Stage}Image`],
    properties,
  };
}

export const handleTransfer = async (event: Event) => {
  const tokenId = event.args.tokenId.toNumber();
  if (tokenId == 0) {
    return;
  }

  const from = event.args.from;
  const id = getNftId(COLLECTION_ID, tokenId);

  if (from == zeroAddr) {
    const petInfo = await getPetInfo(tokenId);

    await NFT.create(
      {
        id,
        creator: event.args.to,
        owner: event.args.to,
        votes: 0,
        nftType: COLLECTION_ID,
        nftId: tokenId,
        status: 1,
        onSale: false,
        name: 'PET #' + tokenId,
        ...petInfo,
      },
      {
        include: [
          {
            model: Property,
            as: 'properties',
          },
        ],
      }
    );

    await Message.create({
      object_type: 1,
      object_id: id,
    });
  } else if (!isBidContract(event.args.to)) {
    const petInfo = await getPetInfo(tokenId);
    const nft = await NFT.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'properties',
        },
      ],
    });
    nft.owner = event.args.to;
    nft.properties = petInfo.properties;
    await nft.save();

    await Message.create({
      object_type: 1,
      object_id: id,
    });
  }
};

import axios from 'axios';
import database from '../database';
const { nft: NFT, nft_property: Property } = database.models;

const IPFS = {
  '0x5019DB2c6B2F31906a715d4Bbf100e40cB823eEb': 'https://ipfs.thetribal.life/ipfs/',
};

const NFT_TYPES = {
  7: '0x5019DB2c6B2F31906a715d4Bbf100e40cB823eEb',
};

export async function syncMetadata(nftId: string) {
  await _syncMetadata(nftId);
}

export async function _syncMetadata(nftId: string) {
  const nft = await NFT.findByPk(nftId);
  const ipfsMetadataURL = nft.tokenUrl.replace('ipfs://', IPFS[NFT_TYPES[nft.nftType]]);
  const res = await axios.get(ipfsMetadataURL).then(res => res.data);
  nft.name = res.name;
  nft.description = res.description;
  nft.fileUrl = res.image;
  const properties = res.attributes
    .filter(attr => {
      return typeof attr.value == 'number' || typeof attr.value == 'string';
    })
    .map(attr => {
      if (typeof attr.value == 'number') {
        return {
          type: 'stats',
          nftId: nft.id,
          name: attr.trait_type,
          intValue: attr.value,
        };
      }
      return {
        type: 'property',
        name: attr.trait_type,
        nftId: nft.id,
        value: attr.value,
      };
    });
  await database.transaction(async () => {
    await nft.save();
    await Property.destroy({where: {nftId: nft.id}});
    await Property.bulkCreate(
        properties
    )
  });
}

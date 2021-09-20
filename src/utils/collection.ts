import sequelize from '../database';
import database from '../database';
const NFT = database.models.nft;
const Collection = database.models.collection;

export const saveTotalOwner = async (collectionId: number) => {
  const rows = await sequelize.query(`select count(DISTINCT owner) from nfts;`);
  const col = await Collection.findByPk(collectionId);
  col.totalOwner = rows[0][0].count;
  await col.save();
};

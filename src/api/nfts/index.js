import { Op } from "sequelize";
import database from "../../database"
import { buildQuery } from "../../utils/query"

const NFT = database.models.nft;


async function list(ctx) {
    const query = buildQuery(ctx, ["creator", "owner","onSale", "status"], ["updatedAt"])
    const nfts = await NFT.findAndCountAll(query)
    ctx.status = 200;
    ctx.body = nfts;
}
  

export default {
    list
}
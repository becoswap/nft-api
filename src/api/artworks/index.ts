import database from '../../database';
import crypto from 'crypto';

const Artwork = database.models.artwork;

async function get(ctx) {
  const artwork = await Artwork.findByPk(ctx.params.id);
  if (!artwork) {
    ctx.status = 404;
    ctx.message = 'Artwork not found';
    return;
  }
  ctx.body = artwork;
}

async function create(ctx) {
  const id = crypto.randomBytes(16).toString('hex');
  const body = ctx.request.body;
  body.id = id;
  await Artwork.create(body);
  ctx.body = {
    tokenURI: 'https://api.nft.becoswap.com/artworks/' + id,
  };
}

export default {
  create,
  get,
};

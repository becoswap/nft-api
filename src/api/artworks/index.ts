import database from '../../database';
import crypto from 'crypto';
import md5 from 'blueimp-md5';

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
  const body = ctx.request.body;
  const id = md5(
    JSON.stringify({
      name: body.name,
      fileUrl: body.fileUrl,
      description: body.description,
      meta: {
        image: body.metadata.image,
        royalties: body.metadata.royalties,
      },
    })
  );

  body.id = id;

  await Artwork.create(body);
  ctx.body = {
    tokenURI: 'https://api-nfts.becoswap.com/artworks/' + id,
  };
}

export default {
  create,
  get,
};

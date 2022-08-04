'use strict';

import auth from 'koa-basic-auth';
import Router from '@koa/router';
import nfts from './nfts';
import events from './events';
import users from './users';
import upload from './upload';
import artworks from './artworks';
import votes from './votes';
import bids from './bids';
import * as properties from './properties';
import collection from './collections';
import images from './images';

const router = new Router();

function authM() {
  return auth({
    name: 'admin',
    pass: process.env.BASIC_AUTH_PASS,
  });
}

// NFTS API -----------------------------
router.get('/v1/nfts', nfts.list);
router.get('/nfts', nfts.listV2);
router.get('/nfts/count', nfts.count);
router.get('/nfts/:id', nfts.get);

router.put('/nfts/:id', authM(), nfts.update);

// NFTs Events API -----------------------------------
router.get('/events', events.list);

// User APIs
router.get('/users', users.list);
router.post('/users', users.createOrUpdate);

// Upload api
router.post('/upload/signature', upload.signature);

// Artworks apis
router.get('/artworks/:id', artworks.get);
router.post('/artworks', artworks.create);

// Votes apis
router.get('/votes', votes.list);

// Bids apis
router.get('/bids', bids.list);

router.get('/properties/stats', properties.stats);

router.get('/collections/:id', collection.get);
router.get('/collections', collection.list);

router.get('/images/text/:text', images.text);



module.exports = router;

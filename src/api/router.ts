'use strict';

import auth from 'koa-basic-auth';
import Router from '@koa/router';
import nfts from './nfts';
import events from './events';
import users from './users';
import upload from './upload';
import artworks from './artworks';
import votes from './votes';

const router = new Router();

function authM() {
  return auth({
    name: 'admin',
    pass: process.env.BASIC_AUTH_PASS,
  });
}

// NFTS API -----------------------------
router.get('/nfts', nfts.list);
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

module.exports = router;

'use strict';

import Router from '@koa/router';
import nfts from './nfts';
import events from './events';
import users from './users';
import upload from "./upload"

const router = new Router();

// NFTS API -----------------------------
router.get('/nfts', nfts.list);

// NFTs Events API -----------------------------------
router.get('/events', events.list);

// User APIs
router.get('/users', users.list);
router.post('/users', users.createOrUpdate);

// Upload api
router.post('upload', upload)

module.exports = router;

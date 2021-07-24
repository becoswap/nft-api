'use strict';

import Router from "@koa/router";
import nfts from "./api/nfts";
import events from "./api/events";

const router = new Router();

// NFTS API -----------------------------
router.get('/nfts', nfts.list);
router.get("/events", events.list);

module.exports = router;

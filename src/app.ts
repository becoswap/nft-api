'use strict';

const Koa = require('koa');
const helmet = require('koa-helmet');
const body = require('koa-bodyparser');
const cors = require('@koa/cors');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
import sequelize from './database';
const router = require('./api/router');
const app = new Koa();

app.use(conditional());
app.use(etag());
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(body());

app.context.cache = {};

app.use(router.routes());
app.use(router.allowedMethods());

async function assertDatabaseConnectionOk() {
  console.log(`Checking database connection...`);
  try {
    await sequelize.sync();
    console.log('Database connection OK!');
  } catch (error) {
    console.log('Unable to connect to the database:');
    console.log(error.message);
    process.exit(1);
  }
}

async function listen() {
  await assertDatabaseConnectionOk();
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`> becoswap-nft-api running! (:${port})`);
}

listen();

'use strict';

const Koa = require('koa');
const helmet = require('koa-helmet');
const body = require('koa-bodyparser');
const cors = require('@koa/cors');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');

require('dotenv').config();

import sequelize from './database';

import typeDefs from './graphql/schemas';
import resolvers from './graphql/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const router = require('./api/router');
const app = new Koa();

// custom 401 handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (401 == err.status) {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic');
      ctx.body = 'cant haz that';
    } else {
      throw err;
    }
  }
});

app.use(conditional());
app.use(etag());
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(body());

app.context.cache = {};

app.use(router.routes());
app.use(router.allowedMethods());

app.use(
  mount(
    '/graphql',
    graphqlHTTP({
      schema: schema,
      graphiql: true,
    })
  )
);

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
  const port = process.env.PORT || 3005;
  app.listen(port);
  console.log(`> becoswap-nft-api running! (:${port})`);
}

listen();

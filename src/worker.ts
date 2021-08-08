require('dotenv').config();

import sequelize from './database';
const workers = require('./workers');

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

async function startWorker() {
  await assertDatabaseConnectionOk();
  workers.run();
}

startWorker();

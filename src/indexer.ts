require('dotenv').config();
import { ethers } from 'ethers';
import fs from 'fs';
import cls from 'cls-hooked';
const namespace = cls.createNamespace('indexer');
const Sequelize = require('sequelize');
Sequelize.useCLS(namespace);
import YAML from 'yaml';

import sequelize from './database';
import { syncContractv2 } from './utils/sync_contract';
import { kaiWeb3 } from './utils/web3';

const modules = ['kripto-galaxy'];

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

function startJob(module, dataSource) {
  const abi = fs.readFileSync(
    `./src/mods/${module}/` + dataSource.source.abi.replace('./', ''),
    'utf8'
  );
  const contract = new ethers.Contract(dataSource.source.address, abi, kaiWeb3);
  const handlers = require(`./mods/${module}/` + dataSource.mapping.file.replace('./', ''));
  const eventHandlersMaps = {};
  for (var handler of dataSource.mapping.eventHandlers) {
    eventHandlersMaps[handler.event] = handler.handler;
  }

  syncContractv2(dataSource.source.address, dataSource.source.startBlock, async (start, end) => {
    const events = await contract.queryFilter({}, start, end);
    for (var event of events) {
      const hanlderFn = handlers[eventHandlersMaps[event.event]];
      if (hanlderFn) {
        await handlers[eventHandlersMaps[event.event]](event);
      }
    }
  });
}

async function start() {
  await assertDatabaseConnectionOk();

  for (var module of modules) {
    const file = fs.readFileSync(`./src/mods/${module}/source.yaml`, 'utf8');
    const sourceConfig = YAML.parse(file);
    for (const dataSource of sourceConfig.dataSources) {
      startJob(module, dataSource);
    }
  }
}

start();

require('dotenv').config();
import { ethers } from 'ethers';
import fs, { readdirSync } from 'fs';
import cls from 'cls-hooked';
const namespace = cls.createNamespace('indexer');
const Sequelize = require('sequelize');
Sequelize.useCLS(namespace);
import YAML from 'yaml';

import sequelize from './database';
import { syncContractv2 } from './utils/sync_contract';
import { kaiWeb3 } from './utils/web3';
import { syncLatestBlock } from './utils/blockNumber';

const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const modules = getDirectories('./src/mods');

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

function getAbi(module, dataSource) {
  return fs.readFileSync(
    `./src/mods/${module}/` + dataSource.source.abi.replace('./', ''),
    'utf8'
  );
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
  await syncLatestBlock();

  let handlers = {};
  let firstBlock = 0;
  for (var module of modules) {
    const file = fs.readFileSync(`./src/mods/${module}/source.yaml`, 'utf8');
    const sourceConfig = YAML.parse(file);
    for (const dataSource of sourceConfig.dataSources) {
      const abi = getAbi(module, dataSource);
      handlers[dataSource.source.address] = {}
      firstBlock = dataSource.source.startBlock;
      let mapping = require(`./mods/${module}/` + dataSource.mapping.file.replace('./', ''));
      for(let h of dataSource.mapping.eventHandlers) {
        let iface = new ethers.utils.Interface(abi);
        let topic = iface.getEventTopic(h.event);
        handlers[dataSource.source.address][topic] = (log) => {
          const args = iface.decodeEventLog(h.event, log.data, log.topics);
          const e = {
            args,
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            address: log.address,
            event: h.event,
            transactionHash: log.transactionHash,
          }
          return mapping[h.handler](e);
        }
      } 
    }
  }


  //
 while (true) {
  const logs = await kaiWeb3.getLogs({
    fromBlock: firstBlock,
    toBlock: firstBlock + 10,
  });
  firstBlock += 10;
  console.log(firstBlock, logs.length)
  for (var log of logs) {
    if (handlers[log.address] && handlers[log.address][log.topics[0]]) {
      handlers[log.address][log.topics[0]](log);
    }
  }
 }
}

start();

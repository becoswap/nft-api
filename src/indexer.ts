require('dotenv').config();
import { ethers } from 'ethers';
import fs, { readdirSync } from 'fs';
import cls from 'cls-hooked';
const namespace = cls.createNamespace('indexer');
const Sequelize = require('sequelize');
Sequelize.useCLS(namespace);
import YAML from 'yaml';

import sequelize from './database';
import { kaiWeb3, web3 } from './utils/web3';
import { getLatestBlock, syncLatestBlock } from './utils/blockNumber';
import database from './database';
import { sleep } from './utils/sleep';

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
  return fs.readFileSync(`./src/mods/${module}/` + dataSource.source.abi.replace('./', ''), 'utf8');
}

const SyncStatus = database.models.sync_status;
const SYNC_MAX_BLOCK = 1000;
async function start() {
  await assertDatabaseConnectionOk();
  await syncLatestBlock();

  let handlers = {};
  let firstBlock = 0;
  let topics = [];
  let addreses = [];
  for (var module of modules) {
    const file = fs.readFileSync(`./src/mods/${module}/source.yaml`, 'utf8');
    const sourceConfig = YAML.parse(file);
    for (const dataSource of sourceConfig.dataSources) {
      const abi = getAbi(module, dataSource);
      handlers[dataSource.source.address] = {};
      firstBlock = dataSource.source.startBlock;
      addreses.push(dataSource.source.address);
      let mapping = require(`./mods/${module}/` + dataSource.mapping.file.replace('./', ''));
      for (let h of dataSource.mapping.eventHandlers) {
        let iface = new ethers.utils.Interface(abi);
        let topic = iface.getEventTopic(h.event);
        topics.push(topic);
        handlers[dataSource.source.address][topic] = log => {
          const args = iface.decodeEventLog(h.event, log.data, log.topics);
          const e = {
            args,
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            address: log.address,
            event: h.event,
            transactionHash: log.transactionHash,
            getTransaction: () => {
              return kaiWeb3.getTransaction(log.transactionHash);
            },
          };
          return mapping[h.handler](e);
        };
      }
    }
  }

  const syncStatuses = await SyncStatus.findOrCreate({
    where: { id: 'xx-1' },
    defaults: { lastBlock: firstBlock },
  });
  const syncStatus: any = syncStatuses[0];
  let startBlock = syncStatus.lastBlock;
  let lastestBlock = 0;

  while (true) {
    try {
      lastestBlock = getLatestBlock() - 1;
      if (lastestBlock < startBlock) {
        await sleep(5000);
        continue;
      }

      let endBlock = startBlock;
      if (lastestBlock - startBlock > SYNC_MAX_BLOCK) {
        endBlock += SYNC_MAX_BLOCK;
      } else {
        endBlock = lastestBlock;
      }

      let logs = await web3.eth.getPastLogs({
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [topics],
        address: addreses,
      });

      logs = logs.filter(log => handlers[log.address] && handlers[log.address][log.topics[0]]);
      console.log("Applying", "event", logs.length, "block", `[${startBlock}, ${endBlock}]`);
      await database.transaction(async () => {
        for (let log of logs) {
          await handlers[log.address][log.topics[0]](log);
        }
        startBlock = endBlock + 1;
        syncStatus.set('lastBlock', startBlock);
        await syncStatus.save();
      });
    } catch (e) {
      const d = new Date();
      console.error(d.toString(), ': sync err: ', e.message);
      await sleep(20000);
    }
  }
}

start();

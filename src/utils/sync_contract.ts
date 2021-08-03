import { kaiWeb3 } from './web3';
import database from '../database';
import { sleep } from './sleep';

const SyncStatus = database.models.sync_status;

const SYNC_MAX_BLOCK = 1000;

export const syncContract = async (contractAddress: string, _startBlock: number, handler) => {
  const syncStatuses = await SyncStatus.findOrCreate({
    where: { id: contractAddress },
    defaults: { lastBlock: _startBlock - 1 },
  });
  const syncStatus: any = syncStatuses[0];
  let startBlock = syncStatus.lastBlock + 1;
  let lastestBlock = 0;
  while (true) {
    try {
      lastestBlock = await kaiWeb3.getBlockNumber();
      if (lastestBlock < startBlock) {
        sleep(5000);
        continue;
      }
    } catch (err) {
      console.log('sync contract ' + contractAddress + ' err: ', err);
      sleep(10000);
      continue;
    }

    const t = await database.transaction();
    try {
      let endBlock = startBlock;
      if (lastestBlock - startBlock > SYNC_MAX_BLOCK) {
        endBlock += SYNC_MAX_BLOCK;
      } else {
        endBlock = lastestBlock;
      }
      await handler(t, startBlock, endBlock);
      syncStatus.set('lastBlock', endBlock);
      await syncStatus.save({ transaction: t });
      await t.commit();
      startBlock = endBlock + 1;
    } catch (err) {
      console.error('sync contract ' + contractAddress + ' err: ', err);
      await t.rollback();
      await sleep(10000);
    }
  }
};

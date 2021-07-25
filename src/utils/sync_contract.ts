import { kaiWeb3 } from './web3';
import database from '../database';
import { sleep } from './sleep';

const SyncStatus = database.models.sync_status;

const SYNC_MAX_BLOCK = 1000;

export const syncContract = async (contractAddress: string, _startBlock: number, handler) => {
  const syncStatuses = await SyncStatus.findOrCreate({
    where: { id: contractAddress },
    defaults: { lastBlock: _startBlock },
  });
  const syncStatus: any = syncStatuses[0];
  let startBlock = syncStatus.lastBlock;
  let lastestBlock = await kaiWeb3.getBlockNumber();
  while (true) {
    const t = await database.transaction();
    try {
      let endBlock = startBlock;
      if (lastestBlock - startBlock > SYNC_MAX_BLOCK) {
        endBlock += SYNC_MAX_BLOCK;
      } else {
        endBlock = lastestBlock;
        lastestBlock = await kaiWeb3.getBlockNumber();
        await sleep(5000);
      }

      await handler(t, startBlock, endBlock);
      syncStatus.set('lastBlock', endBlock);
      await syncStatus.save({ transaction: t });
      await t.commit();
      startBlock = endBlock;
    } catch (err) {
      console.log('sync contract ' + contractAddress + ' err: ', err);
      await t.rollback();
      await sleep(5000);
    }
  }
};

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
  let lastestBlock = await kaiWeb3.getBlockNumber();
  while (true) {
    const t = await database.transaction();
    try {
      let endBlock = startBlock;
      if (lastestBlock - startBlock > SYNC_MAX_BLOCK) {
        endBlock += SYNC_MAX_BLOCK;
      } else {
        while (true) {
          lastestBlock = await kaiWeb3.getBlockNumber();
          if (endBlock > lastestBlock) {
            sleep(5000);
          } else {
            endBlock = lastestBlock;
            break;
          }
        }
      }
      await handler(t, startBlock, endBlock);
      syncStatus.set('lastBlock', endBlock);
      await syncStatus.save({ transaction: t });
      await t.commit();
      startBlock = endBlock + 1;
    } catch (err) {
      console.log('sync contract ' + contractAddress + ' err: ', err);
      await t.rollback();
      await sleep(5000);
    }
  }
};

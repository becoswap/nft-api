import { kaiWeb3 } from './web3';
import database from '../database';
import { sleep } from './sleep';
import { getLatestBlock } from './blockNumber';

const SyncStatus = database.models.sync_status;

const SYNC_MAX_BLOCK = 500;

export const syncContractv2 = async (contractAddress: string, _startBlock: number, handler) => {
  const syncStatuses = await SyncStatus.findOrCreate({
    where: { id: contractAddress },
    defaults: { lastBlock: _startBlock - 1 },
  });
  const syncStatus: any = syncStatuses[0];
  let startBlock = syncStatus.lastBlock + 1;
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

      await database.transaction(async () => {
        await handler(startBlock, endBlock);
        syncStatus.set('lastBlock', endBlock);
        await syncStatus.save();
      });
      startBlock = endBlock + 1;
    } catch (e) {
      const d = new Date();
      console.error(d.toString(), ': sync contract ' + contractAddress + ' err: ', e.message);
      await sleep(60000);
    }
  }
};

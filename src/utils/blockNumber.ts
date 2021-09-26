import { sleep } from './sleep';
import { kaiWeb3 } from './web3';

let _currentBlock = 0;

export const _syncLatestBlock = async () => {
  while (true) {
    try {
      _currentBlock = await kaiWeb3.getBlockNumber();
      await sleep(4000);
    } catch (err) {
      console.error('get latest block number err', err.message);
      await sleep(5000);
    }
  }
};

export const syncLatestBlock = async () => {
  _currentBlock = await kaiWeb3.getBlockNumber();
  _syncLatestBlock();
};

export const getLatestBlock = () => {
  return _currentBlock;
};

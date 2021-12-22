import { ethers } from 'ethers';
import { KAI_RPC } from '../constants';
import Web3 from 'web3';
import { blocks } from '../cache/blocks';
const kaiWeb3 = new ethers.providers.JsonRpcProvider({
  url: KAI_RPC,
  timeout: 5000,
});

let web3 = new Web3(KAI_RPC);

const getBlock = async (blockNumber: number) => {
  let cached = blocks.get(blockNumber);
  if (!cached) {
    const block = await kaiWeb3.getBlock(blockNumber);
    if (block === null) {
      throw Error(`block: ${blockNumber} not found`);
    }
    blocks.set(blockNumber, block);
    cached = block;
  }
  return cached as ethers.providers.Block;
};

export { kaiWeb3, web3, getBlock };

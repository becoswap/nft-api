import { ethers } from 'ethers';
import { KAI_RPC } from '../constants';

const kaiWeb3 = new ethers.providers.JsonRpcProvider({
  url: KAI_RPC,
  timeout: 5000,
});

export { kaiWeb3 };

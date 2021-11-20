import { ethers } from 'ethers';
import { RPC } from '../constants';

const kaiWeb3 = new ethers.providers.JsonRpcProvider({
  url: RPC,
  timeout: 10000,
});

export { kaiWeb3 };

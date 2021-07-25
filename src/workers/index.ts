import * as nftWorker from './nft';
import * as bidWorker from './exchange';
const run = () => {
  nftWorker.run();
  bidWorker.run();
};
export { run };

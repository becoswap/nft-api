import * as nftWorker from './nft';
import * as bidWorker from './bid';
const run = () => {
  nftWorker.run();
  bidWorker.run();
};
export { run };

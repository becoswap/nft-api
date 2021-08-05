import * as nftWorker from './nft';
import * as bidWorker from './bid';
import * as vote from './vote';

const run = () => {
  nftWorker.run();
  bidWorker.run();
  vote.run();
};
export { run };

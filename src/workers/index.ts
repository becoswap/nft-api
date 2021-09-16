import * as nftWorker from './nft';
import * as bidWorker from './bid';
import * as vote from './vote';
import * as kriptoRobot from './kriptoRobot';

const run = () => {
  nftWorker.run();
  bidWorker.run();
  vote.run();
  //kriptoRobot.run();
};
export { run };

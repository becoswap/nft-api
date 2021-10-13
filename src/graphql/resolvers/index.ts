import bidResolver from './bid';
import collectionResolver from './collection';
import eventResolver from './event';
import nftResolver from './nft';
import propertyResolver from './property';
import userResolver from './user';
export default [
  nftResolver,
  eventResolver,
  bidResolver,
  collectionResolver,
  userResolver,
  propertyResolver,
];

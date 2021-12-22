import NodeCache from 'node-cache';

const blocks = new NodeCache({
  stdTTL: 120,
  checkperiod: 10,
});

export { blocks };

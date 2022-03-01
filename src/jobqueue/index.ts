import Queue from 'bull';
import { syncMetadata } from '../utils/sync-metadata';

export const metadataQueue = new Queue('metadata', process.env.REDIS);

metadataQueue.process(async function (job) {
  return syncMetadata(job.data.nftId);
});


export const metadataQueueAdd = async (nftId) => {
  await metadataQueue.add(
    {
      nftId,
    },
    {
      delay: 2000,
      attempts: 10,
      backoff: 60000,
    }
  );
}

metadataQueueAdd("7-1")
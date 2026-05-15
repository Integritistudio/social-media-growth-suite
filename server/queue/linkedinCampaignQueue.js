/**
 * Optional BullMQ queue when REDIS_URL is set.
 * Without Redis, campaigns stay status=queued and the DB-polled worker picks them up.
 */
let connection;
let queueInstance;

function getConnection() {
  if (!process.env.REDIS_URL) return null;
  if (!connection) {
    const IORedis = require('ioredis');
    connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

function getQueue() {
  if (!process.env.REDIS_URL) return null;
  if (!queueInstance) {
    const { Queue } = require('bullmq');
    queueInstance = new Queue('linkedin-campaigns', { connection: getConnection() });
  }
  return queueInstance;
}

async function enqueueCampaignRun(campaignId) {
  const q = getQueue();
  if (!q) return false;
  await q.add(
    'run',
    { campaignId },
    { jobId: `linkedin-campaign-${campaignId}`, removeOnComplete: 50, removeOnFail: 20 }
  );
  return true;
}

module.exports = { enqueueCampaignRun, getConnection, getQueue };

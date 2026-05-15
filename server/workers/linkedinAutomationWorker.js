/**
 * LinkedIn automation worker.
 *
 * Modes:
 * - REDIS_URL set: BullMQ Worker processes jobs (API should enqueue after marking queued).
 * - Otherwise: polls MySQL for campaigns with status=queued every POLL_MS.
 *
 * Run: node workers/linkedinAutomationWorker.js
 * Or: npm run worker:linkedin
 */
require('dotenv').config();
const { setTimeout: delay } = require('timers/promises');
const { LinkedInCampaign, sequelize } = require('../models');
const { runLinkedInCampaign } = require('../services/linkedinAutomation/runCampaign');

const POLL_MS = parseInt(process.env.LINKEDIN_WORKER_POLL_MS || '5000', 10);

async function claimQueuedCampaign() {
  const c = await LinkedInCampaign.findOne({
    where: { status: 'queued' },
    order: [['run_requested_at', 'ASC']],
  });
  if (!c) return null;
  const [n] = await LinkedInCampaign.update(
    { status: 'running', started_at: new Date() },
    { where: { id: c.id, status: 'queued' } }
  );
  return n === 1 ? c.id : null;
}

async function processCampaignId(campaignId) {
  console.log('[linkedin-worker] Running campaign', campaignId);
  try {
    await runLinkedInCampaign(campaignId);
    console.log('[linkedin-worker] Finished campaign', campaignId);
  } catch (e) {
    console.error('[linkedin-worker] Campaign error', campaignId, e.message || e);
  }
}

async function pollLoop() {
  console.log('[linkedin-worker] DB poll mode, interval', POLL_MS, 'ms');
  for (;;) {
    try {
      const id = await claimQueuedCampaign();
      if (id) await processCampaignId(id);
      else await delay(POLL_MS);
    } catch (e) {
      console.error('[linkedin-worker] poll error', e.message || e);
      await delay(POLL_MS);
    }
  }
}

function startBullWorker() {
  const { Worker } = require('bullmq');
  const { getConnection } = require('../queue/linkedinCampaignQueue');
  const conn = getConnection();
  if (!conn) {
    console.error('[linkedin-worker] REDIS_URL set but connection failed');
    process.exit(1);
  }
  const worker = new Worker(
    'linkedin-campaigns',
    async (job) => {
      const campaignId = job.data.campaignId;
      const [n] = await LinkedInCampaign.update(
        { status: 'running', started_at: new Date() },
        { where: { id: campaignId, status: 'queued' } }
      );
      if (n !== 1) {
        console.log('[linkedin-worker] Skip job (not queued)', campaignId);
        return;
      }
      await processCampaignId(campaignId);
    },
    { connection: conn, concurrency: 1 }
  );
  worker.on('failed', (job, err) => {
    console.error('[linkedin-worker] job failed', job?.id, err?.message);
  });
  console.log('[linkedin-worker] BullMQ worker listening');
}

async function main() {
  await sequelize.authenticate();
  if (process.env.REDIS_URL) {
    startBullWorker();
    return;
  }
  await pollLoop();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

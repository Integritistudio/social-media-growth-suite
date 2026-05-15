const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  LinkedInAutomationSettings,
  LinkedInCampaign,
  LinkedInProspect,
  LinkedInOutreachAction,
} = require('../models');
const { encrypt, decrypt } = require('../services/encryptionService');
const { enqueueCampaignRun } = require('../queue/linkedinCampaignQueue');

router.use(auth, adminOnly);

const ROLE_OPTIONS = ['CEO', 'CFO', 'CMO', 'CTO', 'COO', 'Founder', 'President', 'Director', 'VP'];

function maxInvitesCap() {
  const n = parseInt(process.env.LINKEDIN_MAX_INVITES_CAP || '50', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 50;
}

// ── Settings (encrypted credentials; never return secrets) ───────────────

router.get('/settings', async (req, res) => {
  try {
    const row = await LinkedInAutomationSettings.findOne({ where: { user_id: req.user.id } });
    res.json({
      hasCredentials: Boolean(row?.linkedin_email_encrypted && row?.linkedin_password_encrypted),
      linkedinEmailHint: row?.linkedin_email_encrypted ? maskEmail(decrypt(row.linkedin_email_encrypted)) : '',
      lastLoginAt:       row?.last_login_at || null,
      lastLoginError:    row?.last_login_error || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    const { linkedinEmail, linkedinPassword } = req.body;
    if (!linkedinEmail || !linkedinPassword)
      return res.status(400).json({ error: 'linkedinEmail and linkedinPassword are required' });

    const [row] = await LinkedInAutomationSettings.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        linkedin_email_encrypted: '',
        linkedin_password_encrypted: '',
      },
    });
    row.linkedin_email_encrypted = encrypt(String(linkedinEmail).trim());
    row.linkedin_password_encrypted = encrypt(String(linkedinPassword));
    row.last_login_error = null;
    await row.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/settings', async (req, res) => {
  try {
    await LinkedInAutomationSettings.destroy({ where: { user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Campaigns ───────────────────────────────────────────────────────────

router.get('/campaigns', async (req, res) => {
  try {
    const rows = await LinkedInCampaign.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      attributes: { exclude: [] },
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { searchQuery, targetRole, maxInvites, inviteNote } = req.body;
    if (!searchQuery || String(searchQuery).trim().length < 2)
      return res.status(400).json({ error: 'searchQuery is required' });
    const role = ROLE_OPTIONS.includes(targetRole) ? targetRole : 'CEO';
    let max = parseInt(maxInvites, 10) || 5;
    max = Math.max(1, Math.min(max, maxInvitesCap()));
    const note = String(inviteNote || '').slice(0, 300);

    const c = await LinkedInCampaign.create({
      user_id:      req.user.id,
      search_query: String(searchQuery).trim().slice(0, 500),
      target_role:  role,
      max_invites:  max,
      invite_note:  note,
      status:       'draft',
    });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    if (!['draft', 'paused', 'failed'].includes(c.status))
      return res.status(400).json({ error: 'Cannot edit campaign in current status' });

    const { searchQuery, targetRole, maxInvites, inviteNote } = req.body;
    if (searchQuery !== undefined) c.search_query = String(searchQuery).trim().slice(0, 500);
    if (targetRole !== undefined) c.target_role = ROLE_OPTIONS.includes(targetRole) ? targetRole : c.target_role;
    if (maxInvites !== undefined) {
      let max = parseInt(maxInvites, 10) || c.max_invites;
      c.max_invites = Math.max(1, Math.min(max, maxInvitesCap()));
    }
    if (inviteNote !== undefined) c.invite_note = String(inviteNote).slice(0, 300);
    await c.save();
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    if (c.status === 'running' || c.status === 'queued')
      return res.status(400).json({ error: 'Stop the campaign before deleting' });
    await LinkedInOutreachAction.destroy({ where: { campaign_id: c.id } });
    await LinkedInProspect.destroy({ where: { campaign_id: c.id } });
    await c.destroy();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/campaigns/:id/start', async (req, res) => {
  try {
    const settings = await LinkedInAutomationSettings.findOne({ where: { user_id: req.user.id } });
    if (!settings?.linkedin_password_encrypted)
      return res.status(400).json({ error: 'Configure LinkedIn credentials in automation settings first' });

    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    if (!['draft', 'paused', 'failed'].includes(c.status))
      return res.status(400).json({ error: 'Campaign cannot be started from status: ' + c.status });

    await c.update({
      status:             'queued',
      error_message:      null,
      run_requested_at:   new Date(),
      started_at:         null,
      finished_at:        null,
      cancel_requested:   false,
    });
    try {
      await enqueueCampaignRun(c.id);
    } catch (e) {
      console.error('linkedin enqueue:', e.message || e);
    }
    const fresh = await LinkedInCampaign.findByPk(c.id);
    res.json({ success: true, campaign: fresh });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/campaigns/:id/pause', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    if (c.status === 'queued') {
      await c.update({ status: 'paused', run_requested_at: null });
    } else if (c.status === 'running') {
      await c.update({ cancel_requested: true });
    } else {
      return res.status(400).json({ error: 'Nothing to pause' });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/campaigns/:id/prospects', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    const rows = await LinkedInProspect.findAll({
      where: { campaign_id: c.id },
      order: [['created_at', 'DESC']],
      limit: 500,
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/campaigns/:id/actions', async (req, res) => {
  try {
    const c = await LinkedInCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!c) return res.status(404).json({ error: 'Campaign not found' });
    const rows = await LinkedInOutreachAction.findAll({
      where: { campaign_id: c.id },
      order: [['created_at', 'DESC']],
      limit: 500,
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/meta/roles', (req, res) => {
  res.json({ roles: ROLE_OPTIONS, maxInvitesCap: maxInvitesCap() });
});

function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}***@${d}`;
}

module.exports = router;

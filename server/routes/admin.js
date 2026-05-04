const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { User, AISettings } = require('../models');
const { encrypt } = require('../services/encryptionService');

router.use(auth, adminOnly);

// ── Users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'permissions', 'created_at'],
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { role, is_active, permissions } = req.body;
    if (role !== undefined) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;
    if (permissions !== undefined) user.permissions = permissions;
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AI / App Settings ────────────────────────────────────────
router.get('/ai-settings', async (req, res) => {
  try {
    let s = await AISettings.findOne();
    if (!s) s = await AISettings.create({ provider: 'claude' });
    res.json({
      provider:              s.provider,
      hasOpenaiKey:          Boolean(s.openai_key),
      hasClaudeKey:          Boolean(s.claude_key),
      hasMetaToken:          Boolean(s.meta_token),
      igAccountId:           s.ig_account_id || '',
      hasLinkedinToken:      Boolean(s.linkedin_token),
      linkedinUrn:           s.linkedin_urn || '',
      metaAppId:             s.meta_app_id || '',
      hasMetaAppSecret:      Boolean(s.meta_app_secret),
      linkedinClientId:      s.linkedin_client_id || '',
      hasLinkedinClientSecret: Boolean(s.linkedin_client_secret),
      themePrimary:          s.theme_primary,
      themeSecondary:        s.theme_secondary,
      themeButton:           s.theme_button,
      themeMode:             s.theme_mode,
      font:                  s.font,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ai-settings', async (req, res) => {
  try {
    let s = await AISettings.findOne();
    if (!s) s = await AISettings.create({ provider: 'claude' });

    const {
      provider, openaiKey, claudeKey, metaToken, igAccountId,
      linkedinToken, linkedinUrn,
      metaAppId, metaAppSecret, linkedinClientId, linkedinClientSecret,
      themePrimary, themeSecondary, themeButton, themeMode, font,
    } = req.body;

    if (provider)                s.provider               = provider;
    if (openaiKey)               s.openai_key             = encrypt(openaiKey);
    if (claudeKey)               s.claude_key             = encrypt(claudeKey);
    if (metaToken)               s.meta_token             = encrypt(metaToken);
    if (igAccountId !== undefined) s.ig_account_id        = igAccountId;
    if (linkedinToken)           s.linkedin_token         = encrypt(linkedinToken);
    if (linkedinUrn !== undefined) s.linkedin_urn         = linkedinUrn;
    if (metaAppId !== undefined) s.meta_app_id            = metaAppId;
    if (metaAppSecret)           s.meta_app_secret        = encrypt(metaAppSecret);
    if (linkedinClientId !== undefined) s.linkedin_client_id = linkedinClientId;
    if (linkedinClientSecret)    s.linkedin_client_secret = encrypt(linkedinClientSecret);
    if (themePrimary)            s.theme_primary          = themePrimary;
    if (themeSecondary)          s.theme_secondary        = themeSecondary;
    if (themeButton)             s.theme_button           = themeButton;
    if (themeMode)               s.theme_mode             = themeMode;
    if (font)                    s.font                   = font;

    await s.save();
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

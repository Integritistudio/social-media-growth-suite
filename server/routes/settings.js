const express = require('express');
const router = express.Router();
const { AISettings } = require('../models');

// GET /api/settings/public — no auth needed (theme + provider for UI boot)
router.get('/public', async (req, res) => {
  try {
    let s = await AISettings.findOne();
    if (!s) s = await AISettings.create({ provider: 'claude' });
    res.json({
      provider:        s.provider,
      themePrimary:    s.theme_primary,
      themeSecondary:  s.theme_secondary,
      themeButton:     s.theme_button,
      themeMode:       s.theme_mode,
      font:            s.font,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { ConversionEntry, ImportantDM } = require('../models');

router.use(auth);

// ── Conversion Entries ───────────────────────────────────────
router.get('/entries', async (req, res) => {
  try {
    const entries = await ConversionEntry.findAll({
      where: { user_id: req.user.id },
      order: [['date', 'DESC']],
      limit: 90,
    });
    const rows = entries.map(e => ({
      id: e.id, date: e.date,
      impressions: e.impressions, dms: e.dms,
      conversion_rate: e.impressions > 0 ? parseFloat(((e.dms / e.impressions) * 100).toFixed(2)) : 0,
      notes: e.notes,
    }));
    const totImp = rows.reduce((a, r) => a + r.impressions, 0);
    const totDMs = rows.reduce((a, r) => a + r.dms, 0);
    res.json({
      entries: rows,
      summary: {
        totalImpressions: totImp,
        totalDMs: totDMs,
        avgConversion: totImp > 0 ? parseFloat(((totDMs / totImp) * 100).toFixed(2)) : 0,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/entries', async (req, res) => {
  try {
    const { date, impressions, dms, notes } = req.body;
    let e = await ConversionEntry.findOne({ where: { user_id: req.user.id, date } });
    if (e) {
      await e.update({ impressions, dms, notes });
    } else {
      e = await ConversionEntry.create({ user_id: req.user.id, date, impressions, dms, notes });
    }
    const cr = impressions > 0 ? parseFloat(((dms / impressions) * 100).toFixed(2)) : 0;
    res.json({ ...e.toJSON(), conversion_rate: cr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    await ConversionEntry.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Important DMs ────────────────────────────────────────────
router.get('/important-dms', async (req, res) => {
  try {
    const dms = await ImportantDM.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json(dms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/important-dms', async (req, res) => {
  try {
    const { ig_user_id, name, title, notes, source } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const dm = await ImportantDM.create({
      user_id: req.user.id, ig_user_id, name, title, notes,
      source: source || 'instagram',
    });
    res.status(201).json(dm);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/important-dms/:id', async (req, res) => {
  try {
    await ImportantDM.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { BusinessProfile } = require('../models');

router.use(auth);

router.get('/profile', async (req, res) => {
  try {
    const p = await BusinessProfile.findOne({ where: { user_id: req.user.id } });
    res.json(p || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/profile', async (req, res) => {
  try {
    const { name, niche, what, services, target, usp, tone, igHandle } = req.body;
    let p = await BusinessProfile.findOne({ where: { user_id: req.user.id } });
    if (p) {
      await p.update({ name, niche, what, services, target, usp, tone, ig_handle: igHandle });
    } else {
      p = await BusinessProfile.create({ user_id: req.user.id, name, niche, what, services, target, usp, tone, ig_handle: igHandle });
    }
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

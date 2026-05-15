/**
 * LinkedIn UI automation — selectors break when LinkedIn ships UI changes.
 * Set PLAYWRIGHT_HEADLESS=false locally to debug.
 */
const crypto = require('crypto');
const { setTimeout: delay } = require('timers/promises');
const { chromium } = require('playwright');
const {
  LinkedInCampaign,
  LinkedInProspect,
  LinkedInOutreachAction,
  LinkedInAutomationSettings,
} = require('../../models');
const { decrypt } = require('../encryptionService');

const LOGIN_URL = 'https://www.linkedin.com/login';
const DEFAULT_TIMEOUT = 35_000;
const LOGIN_RETRIES = 3;

function dedupeKeyFromUrl(url) {
  const u = normalizeProfileUrl(url);
  return crypto.createHash('sha256').update(u).digest('hex').slice(0, 64);
}

function normalizeProfileUrl(href) {
  try {
    const u = new URL(href, 'https://www.linkedin.com');
    if (!u.hostname.endsWith('linkedin.com')) return href;
    const path = u.pathname.replace(/\/$/, '');
    return `https://www.linkedin.com${path.split('?')[0]}`;
  } catch {
    return href;
  }
}

function titleMatchesRole(title, role) {
  if (!title || !role) return false;
  const t = title.toLowerCase();
  const r = role.toLowerCase();
  if (t.includes(r)) return true;
  const synonyms = {
    ceo: ['chief executive', 'ceo', 'co-founder', 'cofounder', 'founder &'],
    cfo: ['chief financial', 'cfo', 'finance director'],
    cmo: ['chief marketing', 'cmo', 'marketing director', 'vp marketing'],
    cto: ['chief technology', 'cto', 'vp engineering', 'head of engineering'],
    coo: ['chief operating', 'coo', 'operations director'],
    founder: ['founder', 'co-founder', 'cofounder'],
    president: ['president'],
    director: ['director'],
    vp: ['vice president', ' vp', 'v.p.'],
  };
  const list = synonyms[r] || [r];
  return list.some((s) => t.includes(s));
}

async function tryLogin(page, email, password, attempt) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });
  await delay(500 + attempt * 400);

  const userField = page.locator('input#username, input[name="session_key"]').first();
  const passField = page.locator('input#password, input[name="session_password"]').first();
  await userField.fill(email, { timeout: 15_000 });
  await passField.fill(password, { timeout: 15_000 });

  await page.locator('button[type="submit"]').first().click({ timeout: 15_000 });
  await delay(3000);

  if (page.url().includes('checkpoint') || page.url().includes('challenge')) {
    throw new Error('LINKEDIN_SECURITY_CHALLENGE');
  }
  if (await page.locator('input#password:visible').count()) {
    const err = await page.locator('#error-for-password, .form__label--error').first().textContent().catch(() => '');
    if (err) throw new Error('LOGIN_FAILED:' + err.trim());
    throw new Error('LOGIN_FAILED');
  }
  await page.locator('.global-nav, header.global-nav, nav[aria-label="Primary"]').first()
    .waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {});
}

async function openSearchAndPeople(page, query) {
  const search = page.locator([
    'input.search-global-typeahead__input',
    'input[placeholder*="Search"]',
    'input[aria-label*="Search"]',
    '.search-typeahead-v2 input',
  ].join(', ')).first();

  await search.click({ timeout: 15_000 }).catch(async () => {
    await page.keyboard.press('/');
  });
  await search.fill('');
  await search.fill(query, { timeout: 10_000 });
  await page.keyboard.press('Enter');
  await delay(2500);

  const peopleTab = page.getByRole('button', { name: /^People$/i }).or(page.locator('a[href*="f=people"]')).first();
  if (await peopleTab.isVisible({ timeout: 4000 }).catch(() => false)) {
    await peopleTab.click().catch(() => {});
    await delay(2000);
  }
}

async function scrapePeopleCards(page, role, maxScan) {
  const results = [];
  const cards = page.locator('div[data-chameleon-result-urn], li.reusable-search__result-container, .entity-result');
  const count = await cards.count();
  const limit = Math.min(count, maxScan);

  for (let i = 0; i < limit; i++) {
    const card = cards.nth(i);
    const link = card.locator('a[href*="/in/"]').first();
    const href = await link.getAttribute('href').catch(() => null);
    if (!href || !href.includes('/in/')) continue;
    const url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
    const name = (await link.innerText().catch(() => '')).trim().split('\n')[0] || 'Unknown';
    const headline = (await card.locator('.entity-result__primary-subtitle, .entity-result__summary, .subline-level-1')
      .first().innerText().catch(() => '')).trim();

    if (!titleMatchesRole(headline || name, role)) continue;

    results.push({
      person_name: name,
      person_url:  normalizeProfileUrl(url),
      title:       headline || null,
      company_name: null,
      company_url:  null,
    });
  }
  return results;
}

async function sendConnectionRequest(context, prospect, note, campaignId) {
  const page = await context.newPage();
  try {
    await page.goto(prospect.person_url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });
    await delay(1500);

    const pending = page.getByText(/Pending|Invitation sent/i).first();
    if (await pending.isVisible({ timeout: 2000 }).catch(() => false)) {
      await LinkedInOutreachAction.create({
        campaign_id: campaignId,
        prospect_id: prospect.id,
        status:       'skipped',
        error_code:   'ALREADY_PENDING',
        detail:       'Invite already pending',
      });
      return 'skipped';
    }

    let connect = page.getByRole('button', { name: /^Connect$/ }).first();
    if (!(await connect.isVisible({ timeout: 2500 }).catch(() => false))) {
      const more = page.getByRole('button', { name: /^More$/ }).or(page.locator('button[aria-label="More actions"]')).first();
      if (await more.isVisible({ timeout: 2000 }).catch(() => false)) {
        await more.click();
        await delay(400);
        connect = page.getByRole('button', { name: /^Connect$/ }).first();
      }
    }
    if (!(await connect.isVisible({ timeout: 2000 }).catch(() => false))) {
      await LinkedInOutreachAction.create({
        campaign_id: campaignId,
        prospect_id: prospect.id,
        status:       'skipped',
        error_code:   'NO_CONNECT_BUTTON',
        detail:       'Connect not available',
      });
      return 'skipped';
    }
    await connect.click();
    await delay(800);

    const addNote = page.getByRole('button', { name: /Add a note/i }).first();
    if (await addNote.isVisible({ timeout: 4000 }).catch(() => false)) {
      await addNote.click();
      await delay(400);
    }

    const noteBox = page.locator('textarea[name="message"], textarea#custom-message, textarea.connect-button-send-invite__custom-message')
      .first();
    if (await noteBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await noteBox.fill(note.slice(0, 300));
    }

    const send = page.getByRole('button', { name: /^Send$/ }).or(page.getByRole('button', { name: /^Send invitation$/i })).first();
    await send.click({ timeout: 10_000 });
    await delay(1500);

    await LinkedInOutreachAction.create({
      campaign_id: campaignId,
      prospect_id: prospect.id,
      status:      'sent',
      error_code:  null,
      detail:      null,
    });
    return 'sent';
  } catch (e) {
    await LinkedInOutreachAction.create({
      campaign_id: campaignId,
      prospect_id: prospect.id,
      status:      'failed',
      error_code:  'INVITE_ERROR',
      detail:      String(e.message || e).slice(0, 500),
    });
    return 'failed';
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * @param {number} campaignId
 */
async function runLinkedInCampaign(campaignId) {
  const campaign = await LinkedInCampaign.findByPk(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const settings = await LinkedInAutomationSettings.findOne({ where: { user_id: campaign.user_id } });
  if (!settings) throw new Error('No automation settings');

  const email = decrypt(settings.linkedin_email_encrypted);
  const password = decrypt(settings.linkedin_password_encrypted);
  if (!email || !password) throw new Error('Missing LinkedIn credentials');

  const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

  const browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    let lastErr;
    for (let attempt = 0; attempt < LOGIN_RETRIES; attempt++) {
      try {
        await tryLogin(page, email, password, attempt);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        await delay(1500 * (attempt + 1));
      }
    }
    if (lastErr) {
      await settings.update({
        last_login_error: String(lastErr.message).slice(0, 500),
      });
      throw lastErr;
    }
    await settings.update({ last_login_at: new Date(), last_login_error: null });

    await openSearchAndPeople(page, campaign.search_query);
    const scraped = await scrapePeopleCards(page, campaign.target_role, 40);

    for (const row of scraped) {
      await campaign.reload();
      if (campaign.cancel_requested) {
        await campaign.update({ status: 'paused', cancel_requested: false, finished_at: new Date() });
        return;
      }
      if (campaign.invites_sent >= campaign.max_invites) break;

      const key = dedupeKeyFromUrl(row.person_url);
      const [prospect] = await LinkedInProspect.findOrCreate({
        where: { campaign_id: campaign.id, dedupe_key: key },
        defaults: {
          campaign_id:   campaign.id,
          company_name:  row.company_name,
          company_url:   row.company_url,
          person_name:   row.person_name,
          person_url:    row.person_url,
          title:         row.title,
          dedupe_key:    key,
          raw_snapshot:  row,
        },
      });

      const existingSent = await LinkedInOutreachAction.findOne({
        where: { campaign_id: campaign.id, prospect_id: prospect.id, status: 'sent' },
      });
      if (existingSent) continue;

      const outcome = await sendConnectionRequest(context, prospect, campaign.invite_note, campaign.id);
      if (outcome === 'sent') {
        await LinkedInCampaign.increment('invites_sent', { by: 1, where: { id: campaign.id } });
      }
    }

    await campaign.reload();
    if (campaign.status !== 'paused') {
      await campaign.update({
        status:           'completed',
        finished_at:      new Date(),
        cancel_requested: false,
      });
    }
  } catch (e) {
    const msg = String(e.message || e);
    await campaign.update({
      status: 'failed',
      error_message: msg.slice(0, 2000),
      finished_at: new Date(),
    });
    throw e;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

module.exports = { runLinkedInCampaign, titleMatchesRole, normalizeProfileUrl };

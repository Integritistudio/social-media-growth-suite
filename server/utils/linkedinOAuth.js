/** LinkedIn OAuth + URN helpers (Sign In with LinkedIn / OpenID). */

const LINKEDIN_SCOPES = 'openid profile email w_member_social';

function stripEnvQuotes(value) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/^["']|["']$/g, '').trim();
}

function getLinkedInClientCredentials(db = {}) {
  const linkedinClientId =
    db.linkedinClientId ||
    stripEnvQuotes(process.env.LINKEDIN_CLIENT_ID) ||
    stripEnvQuotes(process.env.CLIENT_ID) ||
    '';

  const linkedinClientSecret =
    db.linkedinClientSecret ||
    stripEnvQuotes(process.env.LINKEDIN_CLIENT_SECRET) ||
    stripEnvQuotes(process.env.PRIMARY_CLIENT_SECRET) ||
    '';

  return { linkedinClientId, linkedinClientSecret };
}

/** Person member id from stored account_id or full URN. */
function linkedInPersonId(accountId) {
  if (!accountId) return null;
  const s = String(accountId).trim();
  const prefix = 'urn:li:person:';
  if (s.startsWith(prefix)) return s.slice(prefix.length);
  return s;
}

function linkedInPersonUrn(accountId) {
  const id = linkedInPersonId(accountId);
  return id ? `urn:li:person:${id}` : null;
}

module.exports = {
  LINKEDIN_SCOPES,
  stripEnvQuotes,
  getLinkedInClientCredentials,
  linkedInPersonId,
  linkedInPersonUrn,
};

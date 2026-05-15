const sequelize = require('../config/database');
const User = require('./User');
const BusinessProfile = require('./BusinessProfile');
const AISettings = require('./AISettings');
const ConversionEntry = require('./ConversionEntry');
const ImportantDM = require('./ImportantDM');
const GeneratedContent = require('./GeneratedContent');
const SocialConnection = require('./SocialConnection');

User.hasOne(BusinessProfile,      { foreignKey: 'user_id', as: 'profile' });
BusinessProfile.belongsTo(User,    { foreignKey: 'user_id' });

User.hasMany(ConversionEntry,      { foreignKey: 'user_id', as: 'conversions' });
ConversionEntry.belongsTo(User,    { foreignKey: 'user_id' });

User.hasMany(ImportantDM,          { foreignKey: 'user_id', as: 'importantDMs' });
ImportantDM.belongsTo(User,        { foreignKey: 'user_id' });

User.hasMany(GeneratedContent,     { foreignKey: 'user_id', as: 'generatedContent' });
GeneratedContent.belongsTo(User,   { foreignKey: 'user_id' });

User.hasMany(SocialConnection,     { foreignKey: 'user_id', as: 'socialConnections' });
SocialConnection.belongsTo(User,   { foreignKey: 'user_id' });

const LinkedInAutomationSettings = require('./LinkedInAutomationSettings');
const LinkedInCampaign = require('./LinkedInCampaign');
const LinkedInProspect = require('./LinkedInProspect');
const LinkedInOutreachAction = require('./LinkedInOutreachAction');

User.hasOne(LinkedInAutomationSettings, { foreignKey: 'user_id', as: 'linkedinAutomationSettings' });
LinkedInAutomationSettings.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(LinkedInCampaign, { foreignKey: 'user_id', as: 'linkedinCampaigns' });
LinkedInCampaign.belongsTo(User, { foreignKey: 'user_id' });

LinkedInCampaign.hasMany(LinkedInProspect, { foreignKey: 'campaign_id', as: 'prospects' });
LinkedInProspect.belongsTo(LinkedInCampaign, { foreignKey: 'campaign_id' });

LinkedInCampaign.hasMany(LinkedInOutreachAction, { foreignKey: 'campaign_id', as: 'outreachActions' });
LinkedInOutreachAction.belongsTo(LinkedInCampaign, { foreignKey: 'campaign_id' });
LinkedInOutreachAction.belongsTo(LinkedInProspect, { foreignKey: 'prospect_id' });
LinkedInProspect.hasMany(LinkedInOutreachAction, { foreignKey: 'prospect_id', as: 'actions' });

async function syncDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  const count = await AISettings.count();
  if (count === 0) await AISettings.create({ provider: 'claude' });
  console.log('Database synced');
}

module.exports = {
  sequelize, User, BusinessProfile, AISettings,
  ConversionEntry, ImportantDM, GeneratedContent, SocialConnection,
  LinkedInAutomationSettings, LinkedInCampaign, LinkedInProspect, LinkedInOutreachAction,
  syncDatabase,
};

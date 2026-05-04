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

async function syncDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  const count = await AISettings.count();
  if (count === 0) await AISettings.create({ provider: 'claude' });
  console.log('Database synced');
}

module.exports = {
  sequelize, User, BusinessProfile, AISettings,
  ConversionEntry, ImportantDM, GeneratedContent, SocialConnection, syncDatabase,
};

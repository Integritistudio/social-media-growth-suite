const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AISettings = sequelize.define('AISettings', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  provider:        { type: DataTypes.ENUM('claude', 'openai'), defaultValue: 'claude' },
  openai_key:      { type: DataTypes.TEXT },
  claude_key:      { type: DataTypes.TEXT },
  meta_token:      { type: DataTypes.TEXT },
  ig_account_id:   { type: DataTypes.STRING(255) },
  linkedin_token:  { type: DataTypes.TEXT },
  linkedin_urn:    { type: DataTypes.STRING(255) },
  meta_app_id:     { type: DataTypes.STRING(100) },
  meta_app_secret: { type: DataTypes.TEXT },
  linkedin_client_id:     { type: DataTypes.STRING(100) },
  linkedin_client_secret: { type: DataTypes.TEXT },
  theme_primary:   { type: DataTypes.STRING(20), defaultValue: '#7c6dfa' },
  theme_secondary: { type: DataTypes.STRING(20), defaultValue: '#fa6d8f' },
  theme_button:    { type: DataTypes.STRING(20), defaultValue: '#7c6dfa' },
  theme_mode:      { type: DataTypes.ENUM('dark', 'light'), defaultValue: 'dark' },
  font:            { type: DataTypes.STRING(100), defaultValue: 'Montserrat' },
}, {
  tableName: 'ai_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AISettings;

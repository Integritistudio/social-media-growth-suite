const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinkedInAutomationSettings = sequelize.define('LinkedInAutomationSettings', {
  id:                         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                    { type: DataTypes.INTEGER, allowNull: false, unique: true },
  linkedin_email_encrypted:   { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  linkedin_password_encrypted: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  last_login_at:              { type: DataTypes.DATE, allowNull: true },
  last_login_error:           { type: DataTypes.STRING(500), allowNull: true },
}, {
  tableName: 'linkedin_automation_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LinkedInAutomationSettings;

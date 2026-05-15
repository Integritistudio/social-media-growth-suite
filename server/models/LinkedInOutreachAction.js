const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ACTION_STATUSES = ['queued', 'sent', 'skipped', 'failed'];

const LinkedInOutreachAction = sequelize.define('LinkedInOutreachAction', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaign_id:  { type: DataTypes.INTEGER, allowNull: false },
  prospect_id:  { type: DataTypes.INTEGER, allowNull: true },
  status:       { type: DataTypes.ENUM(...ACTION_STATUSES), allowNull: false, defaultValue: 'queued' },
  error_code:   { type: DataTypes.STRING(80), allowNull: true },
  detail:       { type: DataTypes.STRING(500), allowNull: true },
}, {
  tableName: 'linkedin_outreach_actions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LinkedInOutreachAction;

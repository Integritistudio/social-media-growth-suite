const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const STATUSES = ['draft', 'queued', 'running', 'paused', 'completed', 'failed'];

const LinkedInCampaign = sequelize.define('LinkedInCampaign', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:          { type: DataTypes.INTEGER, allowNull: false },
  search_query:     { type: DataTypes.STRING(500), allowNull: false },
  target_role:      { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'CEO' },
  max_invites:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  invite_note:      { type: DataTypes.STRING(300), allowNull: false, defaultValue: '' },
  status:           { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'draft' },
  error_message:    { type: DataTypes.TEXT, allowNull: true },
  run_requested_at: { type: DataTypes.DATE, allowNull: true },
  started_at:       { type: DataTypes.DATE, allowNull: true },
  finished_at:      { type: DataTypes.DATE, allowNull: true },
  invites_sent:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  cancel_requested: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'linkedin_campaigns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LinkedInCampaign;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinkedInProspect = sequelize.define('LinkedInProspect', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaign_id:   { type: DataTypes.INTEGER, allowNull: false },
  company_name:  { type: DataTypes.STRING(500), allowNull: true },
  company_url:   { type: DataTypes.STRING(1024), allowNull: true },
  person_name:   { type: DataTypes.STRING(300), allowNull: false },
  person_url:    { type: DataTypes.STRING(1024), allowNull: false },
  title:         { type: DataTypes.STRING(500), allowNull: true },
  dedupe_key:    { type: DataTypes.STRING(128), allowNull: false },
  raw_snapshot:  { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'linkedin_prospects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['campaign_id', 'dedupe_key'] }],
});

module.exports = LinkedInProspect;

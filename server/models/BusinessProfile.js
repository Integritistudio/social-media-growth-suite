const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BusinessProfile = sequelize.define('BusinessProfile', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:   { type: DataTypes.INTEGER, allowNull: false },
  name:      { type: DataTypes.STRING(255) },
  niche:     { type: DataTypes.STRING(255) },
  what:      { type: DataTypes.TEXT },
  services:  { type: DataTypes.TEXT },
  target:    { type: DataTypes.TEXT },
  usp:       { type: DataTypes.TEXT },
  tone:      { type: DataTypes.STRING(100) },
  ig_handle: { type: DataTypes.STRING(100) },
}, {
  tableName: 'business_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = BusinessProfile;

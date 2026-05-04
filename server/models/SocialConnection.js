const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialConnection = sequelize.define('SocialConnection', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:       { type: DataTypes.INTEGER, allowNull: false },
  platform:      { type: DataTypes.ENUM('instagram', 'linkedin'), allowNull: false },
  access_token:  { type: DataTypes.TEXT },
  refresh_token: { type: DataTypes.TEXT },
  token_expires: { type: DataTypes.DATE },
  account_id:    { type: DataTypes.STRING(255) },
  account_name:  { type: DataTypes.STRING(255) },
  account_pic:   { type: DataTypes.TEXT },
  scopes:        { type: DataTypes.TEXT },
  raw_profile:   { type: DataTypes.TEXT('long') },
}, {
  tableName: 'social_connections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['user_id', 'platform'] }],
});

module.exports = SocialConnection;

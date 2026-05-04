const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversionEntry = sequelize.define('ConversionEntry', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  dms:         { type: DataTypes.INTEGER, defaultValue: 0 },
  notes:       { type: DataTypes.TEXT },
}, {
  tableName: 'conversion_entries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ConversionEntry;

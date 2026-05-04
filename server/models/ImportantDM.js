const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportantDM = sequelize.define('ImportantDM', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false },
  ig_user_id:  { type: DataTypes.STRING(255) },
  name:        { type: DataTypes.STRING(255), allowNull: false },
  title:       { type: DataTypes.STRING(255) },
  notes:       { type: DataTypes.TEXT },
  source:      { type: DataTypes.STRING(100), defaultValue: 'instagram' },
}, {
  tableName: 'important_dms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ImportantDM;

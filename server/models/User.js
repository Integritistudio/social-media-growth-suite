const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  permissions:   { type: DataTypes.JSON, defaultValue: {} },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.prototype.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

User.beforeCreate(async (user) => {
  user.password_hash = await bcrypt.hash(user.password_hash, 12);
});

module.exports = User;

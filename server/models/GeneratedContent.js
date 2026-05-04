const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneratedContent = sequelize.define('GeneratedContent', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false },
  tool:        { type: DataTypes.STRING(100) },
  content:     { type: DataTypes.TEXT('long') },   // AI-generated text / caption
  image_data:  { type: DataTypes.TEXT('long') },
  image_type:  { type: DataTypes.STRING(50), defaultValue: 'base64' },
  prompt:      { type: DataTypes.TEXT },            // original user input
  ai_provider: { type: DataTypes.STRING(50) },

  // Post management
  status:      { type: DataTypes.ENUM('draft', 'scheduled', 'posted'), defaultValue: 'draft' },
  platform:    { type: DataTypes.ENUM('instagram', 'linkedin', 'both'), defaultValue: 'instagram' },
  posted_at:   { type: DataTypes.DATE },

  // Instagram post tracking
  ig_post_id:     { type: DataTypes.STRING(100) },
  ig_impressions: { type: DataTypes.INTEGER, defaultValue: 0 },
  ig_reach:       { type: DataTypes.INTEGER, defaultValue: 0 },
  ig_likes:       { type: DataTypes.INTEGER, defaultValue: 0 },
  ig_comments:    { type: DataTypes.INTEGER, defaultValue: 0 },
  ig_saved:       { type: DataTypes.INTEGER, defaultValue: 0 },

  // LinkedIn post tracking
  li_post_id:       { type: DataTypes.STRING(200) },
  li_impressions:   { type: DataTypes.INTEGER, defaultValue: 0 },
  li_likes:         { type: DataTypes.INTEGER, defaultValue: 0 },
  li_comments:      { type: DataTypes.INTEGER, defaultValue: 0 },
  li_reposts:       { type: DataTypes.INTEGER, defaultValue: 0 },

  metrics_updated_at: { type: DataTypes.DATE },
}, {
  tableName: 'generated_content',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = GeneratedContent;

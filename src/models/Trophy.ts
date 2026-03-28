import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface TrophyAttributes {
  id: string;
  trophy_key: string;
  name: string;
  description: string;
  url: string;
  color: string;
  class_label: string;
  stat_label: string;
  category: 'speed' | 'accuracy' | 'streak' | 'social' | 'time';
  condition_type: 'wpm' | 'accuracy' | 'streak_days' | 'races_won' | 'duels_won' | 'night_races';
  condition_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sort_order: number;
  created_at?: Date;
}

interface TrophyCreationAttributes extends Optional<TrophyAttributes, 'id'> {}

class Trophy extends Model<TrophyAttributes, TrophyCreationAttributes> implements TrophyAttributes {
  declare id: string;
  declare trophy_key: string;
  declare name: string;
  declare description: string;
  declare url: string;
  declare color: string;
  declare class_label: string;
  declare stat_label: string;
  declare category: 'speed' | 'accuracy' | 'streak' | 'social' | 'time';
  declare condition_type: 'wpm' | 'accuracy' | 'streak_days' | 'races_won' | 'duels_won' | 'night_races';
  declare condition_value: number;
  declare rarity: 'common' | 'rare' | 'epic' | 'legendary';
  declare sort_order: number;
  declare readonly created_at?: Date;
}

Trophy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trophy_key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stat_label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('speed', 'accuracy', 'streak', 'social', 'time'),
      allowNull: false,
    },
    condition_type: {
      type: DataTypes.ENUM('wpm', 'accuracy', 'streak_days', 'races_won', 'duels_won', 'night_races'),
      allowNull: false,
    },
    condition_value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'trophies',
    underscored: true,
    timestamps: false,
  }
);

export default Trophy;

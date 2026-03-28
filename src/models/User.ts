import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface UserAttributes {
  id: string;
  google_id?: string;
  anon_id?: string;
  email?: string;
  display_name: string;
  bio?: string;
  avatar_id?: string;
  profile_picture?: string;
  level: number;
  xp: number;
  best_wpm: number;
  avg_wpm: number;
  total_tests: number;
  streak_days: number;
  last_active?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'level' | 'xp' | 'best_wpm' | 'avg_wpm' | 'total_tests' | 'streak_days'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare google_id?: string;
  declare anon_id?: string;
  declare email?: string;
  declare display_name: string;
  declare bio?: string;
  declare avatar_id?: string;
  declare profile_picture?: string;
  declare level: number;
  declare xp: number;
  declare best_wpm: number;
  declare avg_wpm: number;
  declare total_tests: number;
  declare streak_days: number;
  declare last_active?: Date;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    google_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    anon_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    display_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    best_wpm: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    avg_wpm: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    total_tests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    streak_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['display_name'] },
      { fields: ['best_wpm'] },
    ],
  }
);

export default User;

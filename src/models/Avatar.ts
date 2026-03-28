import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/config.js';

interface AvatarAttributes {
  id: string;
  name: string;
  url: string;
  unlock_level: number;
  rarity: string;
  description: string;
}

class Avatar extends Model<AvatarAttributes> implements AvatarAttributes {
  declare id: string;
  declare name: string;
  declare url: string;
  declare unlock_level: number;
  declare rarity: string;
  declare description: string;
}

Avatar.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unlock_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'avatars',
    underscored: true,
    timestamps: false,
  }
);

export default Avatar;

import { DataTypes, Model, Op, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface UserTrophyAttributes {
  id: string;
  user_id?: string;
  anon_id?: string;
  trophy_id: string;
  unlocked_at?: Date;
}

interface UserTrophyCreationAttributes extends Optional<UserTrophyAttributes, 'id'> {}

class UserTrophy extends Model<UserTrophyAttributes, UserTrophyCreationAttributes> implements UserTrophyAttributes {
  declare id: string;
  declare user_id?: string;
  declare anon_id?: string;
  declare trophy_id: string;
  declare readonly unlocked_at?: Date;
}

UserTrophy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    anon_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trophy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'trophies',
        key: 'id',
      },
    },
    unlocked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_trophies',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'trophy_id'],
        where: {
          user_id: { [Op.ne]: null },
        },
      },
      {
        unique: true,
        fields: ['anon_id', 'trophy_id'],
        where: {
          anon_id: { [Op.ne]: null },
        },
      },
    ],
  }
);

export default UserTrophy;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface FriendAttributes {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at?: Date;
}

interface FriendCreationAttributes extends Optional<FriendAttributes, 'id' | 'created_at'> {}

class Friend extends Model<FriendAttributes, FriendCreationAttributes> implements FriendAttributes {
  public id!: string;
  public user_id!: string;
  public friend_id!: string;
  public status!: 'pending' | 'accepted' | 'blocked';
  public readonly created_at!: Date;
}

Friend.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    friend_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'blocked'), allowNull: false, defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'friends', underscored: true, timestamps: false,
    indexes: [
      { fields: ['user_id', 'friend_id'], unique: true },
      { fields: ['status'] },
    ],
  }
);

export default Friend;

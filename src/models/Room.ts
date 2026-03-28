import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface RoomAttributes {
  id: string;
  room_code: string;
  host_user_id: string | null;
  room_type: 'public' | 'private' | 'duel';
  max_players: number;
  status: 'waiting' | 'in_progress' | 'completed';
  text_content: string;
  created_at?: Date;
  updated_at?: Date;
}

interface RoomCreationAttributes extends Optional<RoomAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: string;
  public room_code!: string;
  public host_user_id!: string | null;
  public room_type!: 'public' | 'private' | 'duel';
  public max_players!: number;
  public status!: 'waiting' | 'in_progress' | 'completed';
  public text_content!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Room.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    room_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    host_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    room_type: {
      type: DataTypes.ENUM('public', 'private', 'duel'),
      allowNull: false,
      defaultValue: 'public',
    },
    max_players: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'waiting',
    },
    text_content: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: 'rooms',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['room_code'], unique: true },
      { fields: ['status'] },
    ],
  }
);

export default Room;

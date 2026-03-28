import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface RoomParticipantAttributes {
  id: string;
  room_id: string;
  user_id: string | null;
  guest_id: string | null;
  display_name: string;
  is_ready: boolean;
  position: number | null;
  wpm: number | null;
  accuracy: number | null;
  joined_at?: Date;
  left_at?: Date | null;
}

interface RoomParticipantCreationAttributes
  extends Optional<RoomParticipantAttributes, 'id' | 'joined_at' | 'left_at' | 'position' | 'wpm' | 'accuracy'> {}

class RoomParticipant
  extends Model<RoomParticipantAttributes, RoomParticipantCreationAttributes>
  implements RoomParticipantAttributes
{
  public id!: string;
  public room_id!: string;
  public user_id!: string | null;
  public guest_id!: string | null;
  public display_name!: string;
  public is_ready!: boolean;
  public position!: number | null;
  public wpm!: number | null;
  public accuracy!: number | null;
  public readonly joined_at!: Date;
  public left_at!: Date | null;
}

RoomParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    room_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    guest_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_ready: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wpm: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'room_participants',
    underscored: true,
    timestamps: false,
  }
);

export default RoomParticipant;

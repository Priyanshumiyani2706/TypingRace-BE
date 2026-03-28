import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface ChallengeAttributes {
  id: string;
  challenger_id: string;
  challenged_id: string;
  room_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at?: Date;
  expires_at?: Date;
}

interface ChallengeCreationAttributes extends Optional<ChallengeAttributes, 'id' | 'room_id' | 'created_at' | 'expires_at'> {}

class Challenge extends Model<ChallengeAttributes, ChallengeCreationAttributes> implements ChallengeAttributes {
  public id!: string;
  public challenger_id!: string;
  public challenged_id!: string;
  public room_id!: string | null;
  public status!: 'pending' | 'accepted' | 'declined' | 'expired';
  public readonly created_at!: Date;
  public expires_at!: Date;
}

Challenge.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    challenger_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    challenged_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    room_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'rooms', key: 'id' } },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'), allowNull: false, defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'challenges', underscored: true, timestamps: false }
);

export default Challenge;

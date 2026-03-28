import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface MatchAttributes {
  id: string;
  room_id: string;
  match_type: 'duel' | 'race' | 'practice';
  text_content: string;
  duration: number;
  winner_id: string | null;
  started_at?: Date;
  completed_at?: Date | null;
}

interface MatchCreationAttributes extends Optional<MatchAttributes, 'id' | 'started_at' | 'completed_at'> {}

class Match extends Model<MatchAttributes, MatchCreationAttributes> implements MatchAttributes {
  public id!: string;
  public room_id!: string;
  public match_type!: 'duel' | 'race' | 'practice';
  public text_content!: string;
  public duration!: number;
  public winner_id!: string | null;
  public readonly started_at!: Date;
  public completed_at!: Date | null;
}

Match.init(
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
    },
    match_type: {
      type: DataTypes.ENUM('duel', 'race', 'practice'),
      allowNull: false,
    },
    text_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    winner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'matches',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['started_at'] },
      { fields: ['room_id'] },
    ],
  }
);

export default Match;

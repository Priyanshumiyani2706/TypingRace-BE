import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface MatchResultAttributes {
  id: string;
  match_id: string;
  user_id: string | null;
  guest_id: string | null;
  wpm: number;
  accuracy: number;
  position: number;
  time_taken: number;
}

interface MatchResultCreationAttributes extends Optional<MatchResultAttributes, 'id'> {}

class MatchResult extends Model<MatchResultAttributes, MatchResultCreationAttributes> implements MatchResultAttributes {
  public id!: string;
  public match_id!: string;
  public user_id!: string | null;
  public guest_id!: string | null;
  public wpm!: number;
  public accuracy!: number;
  public position!: number;
  public time_taken!: number;
}

MatchResult.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    match_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'matches',
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
    wpm: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    time_taken: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'match_results',
    underscored: true,
    timestamps: false,
  }
);

export default MatchResult;

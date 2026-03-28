import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface TestResultAttributes {
  id: string;
  user_id?: string;
  anon_id?: string;
  wpm: number;
  accuracy: number;
  duration: number;
  language: string;
  typed_text: string;
  completed_at?: Date;
}

interface TestResultCreationAttributes extends Optional<TestResultAttributes, 'id' | 'language'> {}

class TestResult extends Model<TestResultAttributes, TestResultCreationAttributes> implements TestResultAttributes {
  declare id: string;
  declare user_id?: string;
  declare anon_id?: string;
  declare wpm: number;
  declare accuracy: number;
  declare duration: number;
  declare language: string;
  declare typed_text: string;
  declare readonly completed_at?: Date;
}

TestResult.init(
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
    wpm: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en',
    },
    typed_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'test_results',
    underscored: true,
    timestamps: false,
  }
);

export default TestResult;

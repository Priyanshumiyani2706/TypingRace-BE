import { DataTypes, Model, Op, Optional } from 'sequelize';
import sequelize from '../db/config.js';

interface ActivityAttributes {
  id: string;
  user_id?: string;
  anon_id?: string;
  date: Date;
  test_count: number;
  created_at?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'test_count'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  declare id: string;
  declare user_id?: string;
  declare anon_id?: string;
  declare date: Date;
  declare test_count: number;
  declare readonly created_at?: Date;
}

Activity.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    test_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'activity',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date'],
        where: {
          user_id: { [Op.ne]: null },
        },
      },
      {
        unique: true,
        fields: ['anon_id', 'date'],
        where: {
          anon_id: { [Op.ne]: null },
        },
      },
    ],
  }
);

export default Activity;

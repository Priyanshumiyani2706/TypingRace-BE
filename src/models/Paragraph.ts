import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/config.js';

export type ParagraphCategory =
  | 'cyberpunk'
  | 'nature'
  | 'technology'
  | 'philosophy'
  | 'programming'
  | 'quotes';

interface ParagraphAttributes {
  id: string;
  category: ParagraphCategory;
  text: string;
  created_at?: Date;
  updated_at?: Date;
}

interface ParagraphCreationAttributes extends Optional<ParagraphAttributes, 'id'> {}

class Paragraph extends Model<ParagraphAttributes, ParagraphCreationAttributes> implements ParagraphAttributes {
  declare id: string;
  declare category: ParagraphCategory;
  declare text: string;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

Paragraph.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    text: {
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
    tableName: 'paragraphs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['category'] },
    ],
  }
);

export default Paragraph;


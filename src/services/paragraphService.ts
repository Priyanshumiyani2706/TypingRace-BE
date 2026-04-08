import { Paragraph } from '../models/index.js';
import sequelize from '../db/config.js';
import { Op } from 'sequelize';

export const paragraphService = {
  async getCategories(): Promise<string[]> {
    const rows = await Paragraph.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      order: [['category', 'ASC']],
      raw: true,
    });
    return rows.map((r: any) => r.category);
  },

  async getRandom(category?: string) {
    const where = category ? { category: { [Op.eq]: category } } : undefined;
    const paragraph = await Paragraph.findOne({
      where,
      order: sequelize.random(),
    });
    return paragraph;
  },
};


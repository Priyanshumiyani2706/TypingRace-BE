import { Request, Response } from 'express';
import { paragraphService } from '../services/paragraphService.js';

export const paragraphController = {
  async categories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await paragraphService.getCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to load categories' });
    }
  },

  async random(req: Request, res: Response): Promise<void> {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const paragraph = await paragraphService.getRandom(category);
      if (!paragraph) {
        res.status(404).json({ error: 'No paragraphs found' });
        return;
      }
      res.json({
        id: paragraph.id,
        category: paragraph.category,
        text: paragraph.text,
      });
    } catch (error) {
      console.error('Get random paragraph error:', error);
      res.status(500).json({ error: 'Failed to load paragraph' });
    }
  },
};


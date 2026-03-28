import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
      return;
    }
    next();
  };

// ── Schemas ──────────────────────────────────────────────────────────────────

export const schemas = {
  googleLogin: Joi.object({
    token: Joi.string().required(),
  }),

  sendChallenge: Joi.object({
    challengedId: Joi.string().uuid().required(),
  }),

  createRoom: Joi.object({
    roomType: Joi.string().valid('public', 'private', 'duel').required(),
    maxPlayers: Joi.number().integer().min(2).max(10).required(),
    textContent: Joi.string().min(10).required(),
  }),

  updateUser: Joi.object({
    display_name: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).allow('').optional(),
    avatar_id: Joi.string().optional().allow(null),
  }),

  saveTestResult: Joi.object({
    wpm: Joi.number().integer().min(0).max(500).required(),
    accuracy: Joi.number().min(0).max(100).required(),
    duration: Joi.number().integer().min(1).required(),
    typed_text: Joi.string().required(),
    language: Joi.string().optional().default('en'),
  }),
};

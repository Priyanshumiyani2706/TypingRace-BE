import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available, otherwise construct from individual params
const databaseUrl = process.env.DATABASE_URL;

let sequelize: Sequelize;

if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 80800,
      idle: 10000,
    },
  });
} else {
  // Fallback to individual connection parameters
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cyberrace',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 80800,
      idle: 10000,
    },
  });
}

export default sequelize;

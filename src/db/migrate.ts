import sequelize from './config.js';
import '../models/index.js';

const migrate = async () => {
  try {
    console.log('Starting database migration...');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Force sync will drop and recreate all tables
    // Use { alter: true } for safer migrations in production
    await sequelize.sync({ force: true });
    console.log('✓ All models synchronized successfully');

    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();

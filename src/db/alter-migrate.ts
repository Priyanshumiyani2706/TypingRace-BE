import sequelize from './config.js';
import '../models/index.js';

const migrate = async () => {
  try {
    console.log('Starting database migration (alter mode)...');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Use alter: true to add new columns without dropping tables
    await sequelize.sync({ alter: true });
    console.log('✓ All models synchronized successfully');

    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();

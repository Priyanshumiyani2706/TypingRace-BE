import { Avatar, Trophy } from '../models/index.js';
import sequelize from './config.js';

const seedAvatars = async () => {
  const avatars = [
    {
      id: 'NEON_SENTINEL',
      name: 'Neon Sentinel',
      url: 'person',
      unlock_level: 1,
      rarity: 'common',
      description: 'Default avatar for all users',
    },
    {
      id: 'CYBER_WARRIOR',
      name: 'Cyber Warrior',
      url: 'shield_person',
      unlock_level: 5,
      rarity: 'common',
      description: 'Unlocked at level 5',
    },
    {
      id: 'DIGITAL_PHANTOM',
      name: 'Digital Phantom',
      url: 'psychology',
      unlock_level: 10,
      rarity: 'rare',
      description: 'Unlocked at level 10',
    },
    {
      id: 'QUANTUM_HACKER',
      name: 'Quantum Hacker',
      url: 'terminal',
      unlock_level: 15,
      rarity: 'rare',
      description: 'Unlocked at level 15',
    },
    {
      id: 'MATRIX_MASTER',
      name: 'Matrix Master',
      url: 'code',
      unlock_level: 20,
      rarity: 'epic',
      description: 'Unlocked at level 20',
    },
    {
      id: 'LEGEND_TYPER',
      name: 'Legend Typer',
      url: 'workspace_premium',
      unlock_level: 30,
      rarity: 'legendary',
      description: 'Unlocked at level 30',
    },
  ];

  await Avatar.bulkCreate(avatars, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${avatars.length} avatars`);
};

const seedTrophies = async () => {
  const trophies: Array<{
    trophy_key: string;
    name: string;
    description: string;
    url: string;
    color: string;
    class_label: string;
    stat_label: string;
    category: 'speed' | 'accuracy' | 'streak' | 'social' | 'time';
    condition_type: 'wpm' | 'accuracy' | 'streak_days' | 'races_won' | 'duels_won' | 'night_races';
    condition_value: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    sort_order: number;
  }> = [
    {
      trophy_key: 'speed_demon',
      name: 'Speed Demon',
      description: 'Reach 100 WPM',
      url: 'bolt',
      color: '#b76dff',
      class_label: 'CLASS_A',
      stat_label: '100 WPM',
      category: 'speed',
      condition_type: 'wpm',
      condition_value: 100,
      rarity: 'rare',
      sort_order: 1,
    },
    {
      trophy_key: 'velocity_master',
      name: 'Velocity Master',
      description: 'Reach 150 WPM',
      url: 'rocket_launch',
      color: '#b76dff',
      class_label: 'CLASS_S',
      stat_label: '150 WPM',
      category: 'speed',
      condition_type: 'wpm',
      condition_value: 150,
      rarity: 'epic',
      sort_order: 2,
    },
    {
      trophy_key: 'perfect_accuracy',
      name: 'Perfect Accuracy',
      description: 'Achieve 100% accuracy',
      url: 'target',
      color: '#4cd7f6',
      class_label: 'CLASS_S',
      stat_label: '100%',
      category: 'accuracy',
      condition_type: 'accuracy',
      condition_value: 100,
      rarity: 'epic',
      sort_order: 3,
    },
    {
      trophy_key: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      url: 'local_fire_department',
      color: '#ffb2b7',
      class_label: 'CLASS_B',
      stat_label: '7 DAYS',
      category: 'streak',
      condition_type: 'streak_days',
      condition_value: 7,
      rarity: 'common',
      sort_order: 4,
    },
    {
      trophy_key: 'month_master',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      url: 'whatshot',
      color: '#ffb2b7',
      class_label: 'CLASS_A',
      stat_label: '30 DAYS',
      category: 'streak',
      condition_type: 'streak_days',
      condition_value: 30,
      rarity: 'legendary',
      sort_order: 5,
    },
    {
      trophy_key: 'night_owl',
      name: 'Night Owl',
      description: 'Complete 10 races between 10 PM and 4 AM',
      url: 'dark_mode',
      color: '#4cd7f6',
      class_label: 'CLASS_B',
      stat_label: '10 RACES',
      category: 'time',
      condition_type: 'night_races',
      condition_value: 10,
      rarity: 'rare',
      sort_order: 6,
    },
  ];

  await Trophy.bulkCreate(trophies, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${trophies.length} trophies`);
};

const seed = async () => {
  try {
    console.log('Starting database seeding...');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await seedAvatars();
    await seedTrophies();

    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

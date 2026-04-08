import { Avatar, Trophy, Paragraph } from '../models/index.js';
import type { ParagraphCategory } from '../models/Paragraph.js';
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

const seedParagraphs = async () => {
  const paragraphs: Array<{ category: ParagraphCategory; text: string }> = [
    // cyberpunk
    {
      category: 'cyberpunk',
      text:
        'The cybernetic infrastructure of the global net requires constant vigilance and precision. Every keystroke is a bit of data reclaimed from chaos. The digital frontier is not a place, but a state of mind.',
    },
    {
      category: 'cyberpunk',
      text:
        'In the depths of the terminal the curator watches every keystroke. Precision is the only currency that matters here. The flicker of the screen reflects the unwavering focus of a master typist.',
    },
    {
      category: 'cyberpunk',
      text:
        'Neon lights pierce through the digital rain as hackers navigate the sprawling network. Each command executed with surgical precision, each line of code a weapon in the cyber war.',
    },
    {
      category: 'cyberpunk',
      text:
        'The matrix unfolds before your eyes, a cascade of green symbols flowing like digital waterfalls. Your fingers dance across the keyboard, translating thought into reality at the speed of light.',
    },

    // nature
    {
      category: 'nature',
      text:
        'Fragile petals drift through the nanotech gardens, where silicon roots meet ancient dreams. The city breathes in hues of neon pink, reflecting a world that never sleeps, yet always remembers the first bloom.',
    },
    {
      category: 'nature',
      text:
        'Mountains rise majestically against the azure sky, their peaks crowned with eternal snow. Rivers carve through valleys, carrying stories of time immemorial to the vast ocean beyond.',
    },
    {
      category: 'nature',
      text:
        'The forest whispers secrets in the language of rustling leaves. Sunlight filters through the canopy, painting dappled patterns on the moss-covered ground below.',
    },
    {
      category: 'nature',
      text:
        'Waves crash against weathered cliffs, their rhythmic pulse echoing the heartbeat of the earth. Seabirds wheel overhead, their cries mingling with the salt-laden breeze.',
    },

    // technology
    {
      category: 'technology',
      text:
        'Artificial intelligence evolves at an exponential rate, learning patterns and making decisions that reshape our digital landscape. Machine learning algorithms process vast datasets, uncovering insights hidden within the noise.',
    },
    {
      category: 'technology',
      text:
        'Quantum computers harness the strange properties of subatomic particles to solve problems that would take classical computers millennia. Superposition and entanglement become tools for computation.',
    },
    {
      category: 'technology',
      text:
        'Blockchain technology creates immutable ledgers, distributed across thousands of nodes. Cryptographic hashing ensures data integrity while maintaining transparency and security.',
    },
    {
      category: 'technology',
      text:
        'Cloud computing revolutionizes how we store and process information. Scalable infrastructure adapts to demand, providing resources on-demand across global data centers.',
    },

    // philosophy
    {
      category: 'philosophy',
      text:
        'The examined life requires constant reflection and questioning of our assumptions. Socrates taught that wisdom begins with acknowledging our own ignorance and seeking truth through dialogue.',
    },
    {
      category: 'philosophy',
      text:
        'Existence precedes essence, as existentialists claim. We are thrown into this world without predetermined purpose, free to create meaning through our choices and actions.',
    },
    {
      category: 'philosophy',
      text:
        'The mind-body problem puzzles philosophers across centuries. How does consciousness emerge from physical matter? Can subjective experience be reduced to neural activity?',
    },
    {
      category: 'philosophy',
      text:
        'Ethics guides our moral compass, helping us navigate complex decisions. Utilitarianism weighs consequences, while deontology emphasizes duty and universal principles.',
    },

    // programming
    {
      category: 'programming',
      text:
        'Functions encapsulate reusable logic, accepting parameters and returning values. Pure functions produce consistent outputs for given inputs, avoiding side effects and maintaining referential transparency.',
    },
    {
      category: 'programming',
      text:
        'Object-oriented programming organizes code into classes and objects. Inheritance enables code reuse, while polymorphism allows different implementations of the same interface.',
    },
    {
      category: 'programming',
      text:
        'Asynchronous programming handles concurrent operations without blocking execution. Promises and async-await syntax simplify working with asynchronous code, making it more readable and maintainable.',
    },
    {
      category: 'programming',
      text:
        'Data structures determine how information is organized and accessed. Arrays provide indexed access, linked lists enable efficient insertion, and hash tables offer constant-time lookups.',
    },

    // quotes
    {
      category: 'quotes',
      text:
        'The only way to do great work is to love what you do. If you have not found it yet, keep looking. Do not settle. As with all matters of the heart, you will know when you find it.',
    },
    {
      category: 'quotes',
      text:
        'In the middle of difficulty lies opportunity. The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.',
    },
    {
      category: 'quotes',
      text:
        'Success is not final, failure is not fatal. It is the courage to continue that counts. Never give up on something you really want. It is difficult to wait, but worse to regret.',
    },
    {
      category: 'quotes',
      text:
        'The future belongs to those who believe in the beauty of their dreams. Dream big, work hard, stay focused, and surround yourself with good people.',
    },
  ];

  await Paragraph.bulkCreate(paragraphs, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${paragraphs.length} paragraphs`);
};

const seed = async () => {
  try {
    console.log('Starting database seeding...');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await seedAvatars();
    await seedTrophies();
    await seedParagraphs();

    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();                    

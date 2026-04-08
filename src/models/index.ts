import User from './User.js';
import TestResult from './TestResult.js';
import Trophy from './Trophy.js';
import UserTrophy from './UserTrophy.js';
import Avatar from './Avatar.js';
import Activity from './Activity.js';
import Room from './Room.js';
import RoomParticipant from './RoomParticipant.js';
import Match from './Match.js';
import MatchResult from './MatchResult.js';
import Friend from './Friend.js';
import Challenge from './Challenge.js';
import Paragraph from './Paragraph.js';

// Define associations
User.hasMany(TestResult, { foreignKey: 'user_id', as: 'testResults' });
TestResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.belongsToMany(Trophy, { through: UserTrophy, foreignKey: 'user_id', as: 'trophies' });
Trophy.belongsToMany(User, { through: UserTrophy, foreignKey: 'trophy_id', as: 'users' });

UserTrophy.belongsTo(Trophy, { foreignKey: 'trophy_id', as: 'trophy' });
Trophy.hasMany(UserTrophy, { foreignKey: 'trophy_id', as: 'userTrophies' });

User.belongsTo(Avatar, { foreignKey: 'avatar_id', as: 'avatar' });

User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Room associations
Room.belongsTo(User, { foreignKey: 'host_user_id', as: 'host' });
Room.hasMany(RoomParticipant, { foreignKey: 'room_id', as: 'participants' });
RoomParticipant.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });
RoomParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Match associations
Room.hasMany(Match, { foreignKey: 'room_id', as: 'matches' });
Match.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });
Match.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });
Match.hasMany(MatchResult, { foreignKey: 'match_id', as: 'results' });
MatchResult.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
MatchResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Friend associations
User.hasMany(Friend, { foreignKey: 'user_id', as: 'friendships' });
User.hasMany(Friend, { foreignKey: 'friend_id', as: 'friendOf' });
Friend.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Friend.belongsTo(User, { foreignKey: 'friend_id', as: 'friend' });

// Challenge associations
User.hasMany(Challenge, { foreignKey: 'challenger_id', as: 'sentChallenges' });
User.hasMany(Challenge, { foreignKey: 'challenged_id', as: 'receivedChallenges' });
Challenge.belongsTo(User, { foreignKey: 'challenger_id', as: 'challenger' });
Challenge.belongsTo(User, { foreignKey: 'challenged_id', as: 'challenged' });
Challenge.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

export {
  User, TestResult, Trophy, UserTrophy, Avatar, Activity,
  Room, RoomParticipant, Match, MatchResult,
  Friend, Challenge,
  Paragraph,
};

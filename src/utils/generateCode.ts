export const generateRoomCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateAnonId = (): string => {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

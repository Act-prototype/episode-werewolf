import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.actprototype.episodewerewolf',
  appName: 'エピソード人狼',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

require('dotenv').config();

const required = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'MONGO_URI',
  'SUGGESTIONS_CHANNEL_ID',
  'BIRTHDAY_CHANNEL_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Falta la variable de entorno: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoUri: process.env.MONGO_URI,
  suggestionsChannelId: process.env.SUGGESTIONS_CHANNEL_ID,
  birthdayChannelId: process.env.BIRTHDAY_CHANNEL_ID,
  birthdayRoleId: process.env.BIRTHDAY_ROLE_ID || null,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || null,
  logChannelId: process.env.LOG_CHANNEL_ID || null,
};

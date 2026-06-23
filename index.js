require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.GuildMember],
});

client.commands = new Collection();

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const cmd = require(fullPath);
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        logger.info(`Comando cargado: /${cmd.data.name}`);
      }
    }
  }
}

function loadEvents(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const event = require(path.join(dir, file));
    const handler = (...args) => event.execute(...args, client);
    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
    logger.info(`Evento cargado: ${event.name}`);
  }
}

async function main() {
  await mongoose.connect(config.mongoUri);
  logger.info('Conectado a MongoDB.');

  loadCommands(path.join(__dirname, 'commands'));
  loadEvents(path.join(__dirname, 'events'));

  await client.login(config.token);
}

main().catch((err) => {
  logger.error(`Error fatal al iniciar el bot: ${err.message}`);
  process.exit(1);
});

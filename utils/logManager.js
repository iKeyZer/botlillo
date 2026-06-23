const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const logger = require('./logger');

async function sendLog(client, options) {
  if (!config.logChannelId) return;

  const channel = client.channels.cache.get(config.logChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setColor(options.color ?? 0xed4245)
    .setTimestamp();

  if (options.fields) embed.addFields(options.fields);
  if (options.description) embed.setDescription(options.description);

  await channel.send({ embeds: [embed] }).catch((err) =>
    logger.warn(`No se pudo enviar log: ${err.message}`)
  );
}

module.exports = { sendLog };

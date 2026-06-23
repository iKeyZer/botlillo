const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const logger = require('./logger');

const activeTimers = new Map();

async function endGiveaway(client, giveaway) {
  if (giveaway.ended) return;

  const channel = client.channels.cache.get(giveaway.channelId);
  if (!channel) return;

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  if (!message) return;

  // Obtener participantes (reacción 🎉 excluyendo bots)
  const reaction = message.reactions.cache.get('🎉');
  let participants = [];
  if (reaction) {
    const users = await reaction.users.fetch();
    participants = users.filter((u) => !u.bot).map((u) => u.id);
  }

  let winnersText = '❌ No hubo participantes';
  const winners = [];

  if (participants.length > 0) {
    const count = Math.min(giveaway.winnerCount, participants.length);
    const shuffled = participants.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) winners.push(shuffled[i]);
    winnersText = winners.map((id) => `<@${id}>`).join(', ');
  }

  const endEmbed = new EmbedBuilder()
    .setTitle(`🎉 Sorteo Finalizado: ${giveaway.prize}`)
    .setDescription(`**Ganador(es):** ${winnersText}\n**Organizado por:** <@${giveaway.hostedBy}>`)
    .setColor(0xed4245)
    .setTimestamp();

  await message.edit({ embeds: [endEmbed] });
  if (winners.length > 0) {
    await channel.send(`🎉 ¡Felicidades ${winnersText}! Ganaron **${giveaway.prize}**`);
  }

  await Giveaway.findByIdAndUpdate(giveaway._id, { ended: true, winners });
  activeTimers.delete(giveaway.messageId);
  logger.info(`Sorteo finalizado: ${giveaway.prize} — Ganadores: ${winners.join(', ') || 'ninguno'}`);
}

function scheduleGiveaway(client, giveaway) {
  const delay = giveaway.endAt.getTime() - Date.now();
  if (delay <= 0) {
    endGiveaway(client, giveaway);
    return;
  }
  const timer = setTimeout(() => endGiveaway(client, giveaway), delay);
  activeTimers.set(giveaway.messageId, timer);
}

async function loadActiveGiveaways(client) {
  const active = await Giveaway.find({ ended: false });
  for (const g of active) scheduleGiveaway(client, g);
  if (active.length > 0) logger.info(`${active.length} sorteo(s) activo(s) cargado(s).`);
}

module.exports = { scheduleGiveaway, loadActiveGiveaways, endGiveaway };

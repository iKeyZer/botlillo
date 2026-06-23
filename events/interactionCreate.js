const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const { startInactivityTimer, stopTimer } = require('../utils/threadManager');
const Suggestion = require('../models/Suggestion');
const { sendLog } = require('../utils/logManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // Comandos slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(`Error ejecutando /${interaction.commandName}: ${err.message}`);
        const msg = { content: '❌ Ocurrió un error al ejecutar este comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // Botones
    if (interaction.isButton()) {
      if (interaction.customId === 'sugerencia_debatir') {
        await handleDebatirButton(interaction);
      }
      return;
    }

    // Modales
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_sug_')) {
        await handleSuggestionModal(interaction);
      }
    }
  },
};

async function handleDebatirButton(interaction) {
  try {
    const threadName = `Debate: ${interaction.message.embeds[0]?.description?.slice(0, 50) || 'Sugerencia'}`;

    const thread = await interaction.message.startThread({
      name: threadName,
      autoArchiveDuration: 1440,
    });

    await thread.send(`💬 Hilo de debate creado por <@${interaction.user.id}>. ¡Comparte tu opinión!\n⏱️ Se cerrará automáticamente tras **30 minutos** de inactividad.`);
    await interaction.reply({ content: '✅ Hilo de debate creado.', ephemeral: true });

    startInactivityTimer(thread);
  } catch (err) {
    logger.error(`Error creando hilo de debate: ${err.message}`);
    await interaction.reply({ content: '❌ No se pudo crear el hilo.', ephemeral: true });
  }
}

async function handleSuggestionModal(interaction) {
  // customId: modal_sug_approved_{id} o modal_sug_rejected_{id}
  const parts = interaction.customId.split('_');
  const decision = parts[2]; // 'approved' o 'rejected'
  const suggestionId = parts[3];
  const razon = interaction.fields.getTextInputValue('razon') || 'Sin razón especificada';

  const suggestion = await Suggestion.findById(suggestionId).catch(() => null);
  if (!suggestion) {
    return interaction.reply({ content: '❌ Sugerencia no encontrada.', ephemeral: true });
  }

  const statusText = decision === 'approved' ? '✅ Aprobada' : '❌ Rechazada';
  const statusColor = decision === 'approved' ? 0x57f287 : 0xed4245;

  // Actualizar el embed original en el canal de sugerencias
  const channel = interaction.guild.channels.cache.get(suggestion.channelId);
  const message = await channel?.messages.fetch(suggestion.messageId).catch(() => null);

  if (message?.embeds[0]) {
    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setColor(statusColor)
      .setFields(
        { name: '✅ A favor', value: String(suggestion.yesVotes), inline: true },
        { name: '❌ En contra', value: String(suggestion.noVotes), inline: true },
        { name: 'Estado', value: statusText, inline: true },
        { name: 'Revisado por', value: interaction.user.tag, inline: true },
        { name: 'Razón', value: razon, inline: true },
      );
    await message.edit({ embeds: [updatedEmbed] });
  }

  await Suggestion.findByIdAndUpdate(suggestionId, { status: decision });

  await sendLog(interaction.client, {
    title: `Sugerencia ${statusText}`,
    color: statusColor,
    fields: [
      { name: 'Revisado por', value: interaction.user.tag, inline: true },
      { name: 'Decisión', value: statusText, inline: true },
      { name: 'Razón', value: razon, inline: false },
      { name: 'Contenido', value: suggestion.content.slice(0, 200), inline: false },
    ],
  });

  logger.info(`Sugerencia ${suggestionId} ${statusText} por ${interaction.user.tag}`);
  await interaction.reply({ content: `✅ Sugerencia marcada como **${statusText}**.`, ephemeral: true });
}

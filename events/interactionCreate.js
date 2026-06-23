const logger = require('../utils/logger');
const { startInactivityTimer, stopTimer } = require('../utils/threadManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Manejar comandos slash
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

    // Manejar botones
    if (interaction.isButton()) {
      if (interaction.customId === 'sugerencia_debatir') {
        await handleDebatirButton(interaction);
      }
    }
  },
};

async function handleDebatirButton(interaction) {
  try {
    if (!interaction.channel.isTextBased()) return;

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

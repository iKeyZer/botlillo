const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('salir')
    .setDescription('Desconecta el bot del canal de voz'),

  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply({ content: '❌ El bot no está en ningún canal de voz.', ephemeral: true });
    }

    connection.destroy();
    await interaction.reply('👋 Bot desconectado del canal de voz.');
  },
};

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cerrardebate')
    .setDescription('Cierra el hilo de debate actual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.channel;

    if (channel.type !== ChannelType.PublicThread && channel.type !== ChannelType.PrivateThread) {
      return interaction.reply({ content: '❌ Este comando solo funciona dentro de un hilo de debate.', ephemeral: true });
    }

    await interaction.reply('🔒 Cerrando hilo de debate...');
    await channel.setLocked(true);
    await channel.setArchived(true);
  },
};

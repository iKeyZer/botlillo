const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testcumpleanos')
    .setDescription('Previsualiza el anuncio de cumpleaños (solo para pruebas)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.guild.channels.cache.get(config.birthdayChannelId);
    if (!channel) {
      return interaction.reply({ content: '❌ Canal de cumpleaños no encontrado.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 ¡Feliz Cumpleaños!')
      .setDescription(`¡Hoy es el cumpleaños de <@${interaction.user.id}>! 🎂\n¡Toda la comunidad te desea un feliz día!`)
      .setColor(0xf5a623)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Anuncio enviado a <#${channel.id}>`, ephemeral: true });
  },
};

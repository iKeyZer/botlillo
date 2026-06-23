const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('miscumpleanos')
    .setDescription('Ver tu fecha de cumpleaños registrada'),

  async execute(interaction) {
    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

    if (!user || !user.birthdayDay) {
      return interaction.reply({
        content: '❌ No tienes ningún cumpleaños registrado. Usa `/cumpleaños` para registrarlo.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎂 Tu cumpleaños')
      .setDescription(`Tu cumpleaños está registrado el **${user.birthdayDay} de ${MESES[user.birthdayMonth - 1]}**`)
      .addFields({ name: '🎁 Puntos acumulados', value: String(user.birthdayPoints), inline: true })
      .setColor(0xf5a623)
      .setThumbnail(interaction.user.displayAvatarURL());

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

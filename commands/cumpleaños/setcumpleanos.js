const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const logger = require('../../utils/logger');

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cumpleaños')
    .setDescription('Registra tu fecha de cumpleaños')
    .addIntegerOption((opt) =>
      opt.setName('dia').setDescription('Día de tu cumpleaños (1-31)').setRequired(true).setMinValue(1).setMaxValue(31)
    )
    .addIntegerOption((opt) =>
      opt.setName('mes').setDescription('Mes de tu cumpleaños (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)
    ),

  async execute(interaction) {
    const dia = interaction.options.getInteger('dia');
    const mes = interaction.options.getInteger('mes');

    if (dia > DAYS_IN_MONTH[mes - 1]) {
      return interaction.reply({
        content: `❌ El mes ${mes} no tiene ${dia} días.`,
        ephemeral: true,
      });
    }

    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      { birthdayDay: dia, birthdayMonth: mes },
      { upsert: true, new: true }
    );

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const embed = new EmbedBuilder()
      .setTitle('🎂 Cumpleaños registrado')
      .setDescription(`Tu cumpleaños ha sido guardado: **${dia} de ${meses[mes - 1]}**`)
      .setColor(0xf5a623)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'Te avisaremos el día de tu cumpleaños 🎉' });

    logger.info(`Cumpleaños registrado para ${interaction.user.tag}: ${dia}/${mes}`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

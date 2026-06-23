const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listacumpleanos')
    .setDescription('Muestra los cumpleaños de este mes'),

  async execute(interaction) {
    const mes = new Date().getMonth() + 1;

    const users = await User.find({ guildId: interaction.guild.id, birthdayMonth: mes }).sort({ birthdayDay: 1 });

    if (!users.length) {
      return interaction.reply({ content: `No hay cumpleaños registrados en ${MESES[mes - 1]}.`, ephemeral: true });
    }

    const lines = users.map((u) => `📅 **${u.birthdayDay} de ${MESES[u.birthdayMonth - 1]}** — <@${u.userId}>`);

    const embed = new EmbedBuilder()
      .setTitle(`🎂 Cumpleaños de ${MESES[mes - 1]}`)
      .setDescription(lines.join('\n'))
      .setColor(0xf5a623)
      .setFooter({ text: `${users.length} cumpleaños este mes` });

    await interaction.reply({ embeds: [embed] });
  },
};

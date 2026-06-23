const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const { scheduleGiveaway } = require('../../utils/giveawayManager');
const { parseDuration, formatDuration } = require('../../utils/parseDuration');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteo')
    .setDescription('Crea un sorteo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt.setName('duracion').setDescription('Duración: 10m, 2h, 1d').setRequired(true))
    .addStringOption((opt) => opt.setName('premio').setDescription('Premio del sorteo').setRequired(true))
    .addIntegerOption((opt) => opt.setName('ganadores').setDescription('Número de ganadores').setRequired(false).setMinValue(1).setMaxValue(10)),

  async execute(interaction) {
    const durStr = interaction.options.getString('duracion');
    const prize = interaction.options.getString('premio');
    const winnerCount = interaction.options.getInteger('ganadores') ?? 1;

    const duration = parseDuration(durStr);
    if (!duration) {
      return interaction.reply({ content: '❌ Formato de duración inválido. Usa: `10m`, `2h`, `1d`', ephemeral: true });
    }

    const endAt = new Date(Date.now() + duration);

    const embed = new EmbedBuilder()
      .setTitle(`🎉 SORTEO: ${prize}`)
      .setDescription(`Reacciona con 🎉 para participar!\n\n**Ganadores:** ${winnerCount}\n**Termina:** <t:${Math.floor(endAt.getTime() / 1000)}:R>\n**Organizado por:** <@${interaction.user.id}>`)
      .setColor(0xf5a623)
      .setFooter({ text: `Duración: ${formatDuration(duration)}` })
      .setTimestamp(endAt);

    await interaction.reply({ content: '✅ Sorteo creado.', ephemeral: true });
    const msg = await interaction.channel.send({ embeds: [embed] });
    await msg.react('🎉');

    const giveaway = await Giveaway.create({
      messageId: msg.id,
      channelId: interaction.channel.id,
      guildId: interaction.guild.id,
      hostedBy: interaction.user.id,
      prize,
      winnerCount,
      endAt,
    });

    scheduleGiveaway(interaction.client, giveaway);
  },
};

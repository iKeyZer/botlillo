const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const { endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terminar')
    .setDescription('Termina un sorteo anticipadamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt.setName('mensaje_id').setDescription('ID del mensaje del sorteo').setRequired(true)),

  async execute(interaction) {
    const messageId = interaction.options.getString('mensaje_id');
    const giveaway = await Giveaway.findOne({ messageId, guildId: interaction.guild.id });

    if (!giveaway) return interaction.reply({ content: '❌ Sorteo no encontrado.', ephemeral: true });
    if (giveaway.ended) return interaction.reply({ content: '❌ Este sorteo ya finalizó.', ephemeral: true });

    await interaction.reply({ content: '⏩ Finalizando sorteo...', ephemeral: true });
    await endGiveaway(interaction.client, giveaway);
  },
};

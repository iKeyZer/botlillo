const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../models/Giveaway');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Elige un nuevo ganador para un sorteo finalizado')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt.setName('mensaje_id').setDescription('ID del mensaje del sorteo').setRequired(true)),

  async execute(interaction) {
    const messageId = interaction.options.getString('mensaje_id');
    const giveaway = await Giveaway.findOne({ messageId, guildId: interaction.guild.id });

    if (!giveaway || !giveaway.ended) {
      return interaction.reply({ content: '❌ Sorteo no encontrado o no ha finalizado aún.', ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(giveaway.channelId);
    const message = await channel?.messages.fetch(messageId).catch(() => null);
    if (!message) return interaction.reply({ content: '❌ No se encontró el mensaje del sorteo.', ephemeral: true });

    const reaction = message.reactions.cache.get('🎉');
    if (!reaction) return interaction.reply({ content: '❌ No hay participantes.', ephemeral: true });

    const users = await reaction.users.fetch();
    const participants = users.filter((u) => !u.bot).map((u) => u.id);

    if (!participants.length) return interaction.reply({ content: '❌ No hay participantes válidos.', ephemeral: true });

    const winner = participants[Math.floor(Math.random() * participants.length)];
    await interaction.reply(`🎉 ¡Nuevo ganador del sorteo **${giveaway.prize}**: <@${winner}>!`);
  },
};

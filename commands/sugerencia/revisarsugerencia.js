const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Suggestion = require('../../models/Suggestion');
const { sendLog } = require('../../utils/logManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('revisarsugerencia')
    .setDescription('Aprueba o rechaza una sugerencia')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt.setName('id').setDescription('ID de la sugerencia (de MongoDB)').setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('decision')
        .setDescription('Decisión sobre la sugerencia')
        .setRequired(true)
        .addChoices(
          { name: '✅ Aprobar', value: 'approved' },
          { name: '❌ Rechazar', value: 'rejected' }
        )
    )
    .addStringOption((opt) =>
      opt.setName('razon').setDescription('Razón de la decisión').setRequired(false)
    ),

  async execute(interaction) {
    const id = interaction.options.getString('id');
    const decision = interaction.options.getString('decision');
    const razon = interaction.options.getString('razon') || 'Sin razón especificada';

    const suggestion = await Suggestion.findById(id).catch(() => null);
    if (!suggestion) {
      return interaction.reply({ content: '❌ No se encontró la sugerencia con ese ID.', ephemeral: true });
    }

    if (suggestion.status !== 'pending') {
      return interaction.reply({ content: '❌ Esta sugerencia ya fue revisada.', ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(suggestion.channelId);
    const message = await channel?.messages.fetch(suggestion.messageId).catch(() => null);

    const statusText = decision === 'approved' ? '✅ Aprobada' : '❌ Rechazada';
    const statusColor = decision === 'approved' ? 0x57f287 : 0xed4245;

    if (message) {
      const oldEmbed = message.embeds[0];
      if (oldEmbed) {
        const updatedEmbed = EmbedBuilder.from(oldEmbed)
          .setColor(statusColor)
          .setFields(
            { name: '✅ A favor', value: String(suggestion.yesVotes), inline: true },
            { name: '❌ En contra', value: String(suggestion.noVotes), inline: true },
            { name: 'Estado', value: statusText, inline: true },
            { name: 'Revisado por', value: interaction.user.tag, inline: true },
            { name: 'Razón', value: razon, inline: true }
          );
        await message.edit({ embeds: [updatedEmbed] });
      }
    }

    await Suggestion.findByIdAndUpdate(id, { status: decision });

    await sendLog(interaction.client, {
      title: `Sugerencia ${statusText}`,
      color: statusColor,
      fields: [
        { name: 'Revisado por', value: interaction.user.tag, inline: true },
        { name: 'Decisión', value: statusText, inline: true },
        { name: 'Razón', value: razon, inline: false },
        { name: 'Contenido', value: suggestion.content.slice(0, 200), inline: false },
      ],
    });

    await interaction.reply({ content: `✅ Sugerencia marcada como **${statusText}**.`, ephemeral: true });
  },
};

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const Suggestion = require('../../models/Suggestion');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('versugerencias')
    .setDescription('Revisa y gestiona las sugerencias pendientes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const suggestions = await Suggestion.find({ guildId: interaction.guild.id, status: 'pending' }).sort({ createdAt: -1 });

    if (!suggestions.length) {
      return interaction.reply({ content: '✅ No hay sugerencias pendientes.', ephemeral: true });
    }

    let page = 0;

    const buildEmbed = (p) => {
      const s = suggestions[p];
      return new EmbedBuilder()
        .setTitle(`📋 Sugerencias Pendientes — ${p + 1} / ${suggestions.length}`)
        .setDescription(`> ${s.content}`)
        .addFields(
          { name: 'Autor', value: `<@${s.authorId}>`, inline: true },
          { name: '✅ A favor', value: String(s.yesVotes), inline: true },
          { name: '❌ En contra', value: String(s.noVotes), inline: true },
        )
        .setColor(0x5865f2)
        .setFooter({ text: `ID: ${s._id}` })
        .setTimestamp(s.createdAt);
    };

    const buildRows = (p) => {
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sug_prev').setLabel('◀ Anterior').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('sug_next').setLabel('Siguiente ▶').setStyle(ButtonStyle.Secondary).setDisabled(p === suggestions.length - 1),
      );
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sug_aprobar').setLabel('✅ Aprobar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('sug_rechazar').setLabel('❌ Rechazar').setStyle(ButtonStyle.Danger),
      );
      return [navRow, actionRow];
    };

    const reply = await interaction.reply({
      embeds: [buildEmbed(page)],
      components: buildRows(page),
      ephemeral: true,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) return btn.deferUpdate();

      if (btn.customId === 'sug_prev') {
        page--;
        return btn.update({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }

      if (btn.customId === 'sug_next') {
        page++;
        return btn.update({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }

      if (btn.customId === 'sug_aprobar' || btn.customId === 'sug_rechazar') {
        const decision = btn.customId === 'sug_aprobar' ? 'approved' : 'rejected';
        const suggestionId = suggestions[page]._id.toString();

        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const modal = new ModalBuilder()
          .setCustomId(`modal_sug_${decision}_${suggestionId}`)
          .setTitle(decision === 'approved' ? '✅ Aprobar Sugerencia' : '❌ Rechazar Sugerencia')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('razon')
                .setLabel('Razón (opcional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(500)
            )
          );

        await btn.showModal(modal);
      }
    });

    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => null));
  },
};

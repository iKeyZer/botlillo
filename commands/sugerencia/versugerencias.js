const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Suggestion = require('../../models/Suggestion');

const PAGE_SIZE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('versugerencias')
    .setDescription('Lista las sugerencias pendientes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const suggestions = await Suggestion.find({ guildId: interaction.guild.id, status: 'pending' }).sort({ createdAt: -1 });

    if (!suggestions.length) {
      return interaction.reply({ content: '✅ No hay sugerencias pendientes.', ephemeral: true });
    }

    let page = 0;
    const totalPages = Math.ceil(suggestions.length / PAGE_SIZE);

    const buildEmbed = (p) => {
      const slice = suggestions.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
      return new EmbedBuilder()
        .setTitle(`📋 Sugerencias Pendientes (${suggestions.length})`)
        .setColor(0x5865f2)
        .setDescription(
          slice
            .map((s, i) => `**${p * PAGE_SIZE + i + 1}.** <@${s.authorId}>\n> ${s.content.slice(0, 100)}\n\`ID: ${s._id}\` | ✅ ${s.yesVotes} ❌ ${s.noVotes}`)
            .join('\n\n')
        )
        .setFooter({ text: `Página ${p + 1} de ${totalPages}` });
    };

    const buildRow = (p) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sug_prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('sug_next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(p === totalPages - 1)
      );

    const reply = await interaction.reply({ embeds: [buildEmbed(page)], components: [buildRow(page)], ephemeral: true, fetchReply: true });

    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) return btn.deferUpdate();
      if (btn.customId === 'sug_prev') page--;
      if (btn.customId === 'sug_next') page++;
      await btn.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
    });
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => null));
  },
};

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const { endGiveaway } = require('../../utils/giveawayManager');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('versorteos')
    .setDescription('Revisa y gestiona los sorteos activos')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const giveaways = await Giveaway.find({ guildId: interaction.guild.id, ended: false }).sort({ endAt: 1 });

    if (!giveaways.length) {
      return interaction.reply({ content: '✅ No hay sorteos activos.', ephemeral: true });
    }

    let page = 0;

    const buildEmbed = (p) => {
      const g = giveaways[p];
      const endTimestamp = Math.floor(g.endAt.getTime() / 1000);
      return new EmbedBuilder()
        .setTitle(`🎉 Sorteos Activos — ${p + 1} / ${giveaways.length}`)
        .addFields(
          { name: 'Premio', value: g.prize, inline: true },
          { name: 'Ganadores', value: String(g.winnerCount), inline: true },
          { name: 'Termina', value: `<t:${endTimestamp}:R>`, inline: true },
          { name: 'Organizado por', value: `<@${g.hostedBy}>`, inline: true },
          { name: 'Canal', value: `<#${g.channelId}>`, inline: true },
        )
        .setColor(0xf5a623)
        .setFooter({ text: `ID mensaje: ${g.messageId}` })
        .setTimestamp();
    };

    const buildRows = (p) => {
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sort_prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId('sort_next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(p === giveaways.length - 1),
      );
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sort_terminar').setLabel('⏩ Terminar').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('sort_reroll').setLabel('🔄 Reroll').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('sort_eliminar').setLabel('🗑️ Eliminar').setStyle(ButtonStyle.Danger),
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

      if (btn.customId === 'sort_prev') {
        page--;
        return btn.update({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }

      if (btn.customId === 'sort_next') {
        page++;
        return btn.update({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }

      if (btn.customId === 'sort_terminar') {
        const g = giveaways[page];
        await btn.deferUpdate();
        await endGiveaway(btn.client, g);
        giveaways.splice(page, 1);

        if (!giveaways.length) {
          return btn.editReply({ content: '✅ No quedan más sorteos activos.', embeds: [], components: [] });
        }
        if (page >= giveaways.length) page = giveaways.length - 1;
        return btn.editReply({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }

      if (btn.customId === 'sort_reroll') {
        const g = giveaways[page];
        const channel = btn.guild.channels.cache.get(g.channelId);
        const message = await channel?.messages.fetch(g.messageId).catch(() => null);

        if (!message) {
          return btn.reply({ content: '❌ No se encontró el mensaje del sorteo.', ephemeral: true });
        }

        const reaction = message.reactions.cache.get('🎉');
        const users = reaction ? await reaction.users.fetch() : null;
        const participants = users ? users.filter((u) => !u.bot).map((u) => u.id) : [];

        if (!participants.length) {
          return btn.reply({ content: '❌ No hay participantes para hacer reroll.', ephemeral: true });
        }

        const winner = participants[Math.floor(Math.random() * participants.length)];
        await channel.send(`🔄 ¡Nuevo ganador del sorteo **${g.prize}**: <@${winner}>!`);
        logger.info(`Reroll de sorteo ${g.messageId}: nuevo ganador ${winner}`);
        return btn.reply({ content: `✅ Reroll realizado. Nuevo ganador: <@${winner}>`, ephemeral: true });
      }

      if (btn.customId === 'sort_eliminar') {
        const g = giveaways[page];
        const channel = btn.guild.channels.cache.get(g.channelId);
        const message = await channel?.messages.fetch(g.messageId).catch(() => null);
        if (message) await message.delete().catch(() => null);

        await Giveaway.findByIdAndDelete(g._id);
        giveaways.splice(page, 1);
        logger.info(`Sorteo eliminado: ${g.prize}`);

        if (!giveaways.length) {
          return btn.update({ content: '✅ No quedan más sorteos activos.', embeds: [], components: [] });
        }
        if (page >= giveaways.length) page = giveaways.length - 1;
        return btn.update({ embeds: [buildEmbed(page)], components: buildRows(page) });
      }
    });

    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => null));
  },
};

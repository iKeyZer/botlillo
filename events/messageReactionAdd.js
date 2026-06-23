const Suggestion = require('../models/Suggestion');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    // Cargar la reacción completa si está parcial (cache miss)
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const emoji = reaction.emoji.name;
    if (emoji !== '✅' && emoji !== '❌') return;

    const suggestion = await Suggestion.findOne({ messageId: reaction.message.id });
    if (!suggestion) return;

    // Contar votos reales desde el mensaje (excluye al bot)
    const yesReaction = reaction.message.reactions.cache.get('✅');
    const noReaction = reaction.message.reactions.cache.get('❌');

    const yesCount = yesReaction ? yesReaction.count - 1 : 0;
    const noCount = noReaction ? noReaction.count - 1 : 0;

    await Suggestion.findByIdAndUpdate(suggestion._id, {
      yesVotes: yesCount,
      noVotes: noCount,
    });

    // Actualizar el embed con los nuevos conteos
    const msg = reaction.message;
    const oldEmbed = msg.embeds[0];
    if (!oldEmbed) return;

    const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(
      { name: '✅ A favor', value: String(yesCount), inline: true },
      { name: '❌ En contra', value: String(noCount), inline: true },
      { name: 'Estado', value: '⏳ Pendiente', inline: true }
    );

    await msg.edit({ embeds: [updatedEmbed] });
    logger.info(`Votos actualizados para sugerencia ${suggestion._id}: ✅${yesCount} ❌${noCount}`);
  },
};

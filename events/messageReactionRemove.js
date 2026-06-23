const Suggestion = require('../models/Suggestion');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }

    const emoji = reaction.emoji.name;
    if (emoji !== '✅' && emoji !== '❌') return;

    const suggestion = await Suggestion.findOne({ messageId: reaction.message.id });
    if (!suggestion) return;

    const yesReaction = reaction.message.reactions.cache.get('✅');
    const noReaction = reaction.message.reactions.cache.get('❌');
    const yesCount = yesReaction ? yesReaction.count - 1 : 0;
    const noCount = noReaction ? noReaction.count - 1 : 0;

    await Suggestion.findByIdAndUpdate(suggestion._id, { yesVotes: yesCount, noVotes: noCount });

    const oldEmbed = reaction.message.embeds[0];
    if (!oldEmbed) return;

    const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(
      { name: '✅ A favor', value: String(yesCount), inline: true },
      { name: '❌ En contra', value: String(noCount), inline: true },
      { name: 'Estado', value: '⏳ Pendiente', inline: true }
    );

    await reaction.message.edit({ embeds: [updatedEmbed] });
    logger.info(`Votos actualizados (remove) para sugerencia ${suggestion._id}: ✅${yesCount} ❌${noCount}`);
  },
};

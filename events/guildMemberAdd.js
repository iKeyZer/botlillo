const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('👋 ¡Bienvenido al servidor!')
      .setDescription(
        `¡Hola <@${member.id}>! Bienvenido a **${member.guild.name}**.\nEres el miembro número **${member.guild.memberCount}**.`
      )
      .setColor(0x5865f2)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `Únete: ${new Date().toLocaleDateString('es-MX')}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    logger.info(`Bienvenida enviada para ${member.user.tag}`);
  },
};

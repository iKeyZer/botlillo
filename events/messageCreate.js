const { ChannelType } = require('discord.js');
const { resetInactivityTimer } = require('../utils/threadManager');

module.exports = {
  name: 'messageCreate',
  execute(message) {
    if (message.author.bot) return;
    if (
      message.channel.type === ChannelType.PublicThread ||
      message.channel.type === ChannelType.PrivateThread
    ) {
      resetInactivityTimer(message.channel);
    }
  },
};

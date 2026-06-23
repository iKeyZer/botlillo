const { startBirthdayChecker } = require('../utils/birthdayChecker');
const { loadActiveGiveaways } = require('../utils/giveawayManager');
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Bot listo y conectado como: ${client.user.tag}`);
    startBirthdayChecker(client);
    await loadActiveGiveaways(client);
  },
};

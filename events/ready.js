const { ActivityType } = require('discord.js');
const { startBirthdayChecker } = require('../utils/birthdayChecker');
const { loadActiveGiveaways } = require('../utils/giveawayManager');
const logger = require('../utils/logger');

const activities = [
  { name: '/sugerencia — Envía tu idea', type: ActivityType.Watching },
  { name: '/sorteo — Crea un sorteo', type: ActivityType.Watching },
  { name: '/cumpleaños — Registra tu fecha', type: ActivityType.Watching },
  { name: '/listacumpleanos — Ver cumpleaños', type: ActivityType.Watching },
  { name: '/versorteos — Gestiona sorteos', type: ActivityType.Watching },
];

function setRotatingActivity(client) {
  let index = 0;
  const update = () => {
    client.user.setPresence({
      activities: [activities[index]],
      status: 'online',
    });
    index = (index + 1) % activities.length;
  };
  update();
  setInterval(update, 30_000);
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Bot listo y conectado como: ${client.user.tag}`);
    startBirthdayChecker(client);
    await loadActiveGiveaways(client);
    setRotatingActivity(client);
  },
};

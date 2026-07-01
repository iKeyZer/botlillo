const { getVoiceConnection } = require('@discordjs/voice');
const logger = require('../utils/logger');

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutos
const timers = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState) {
    const guild = oldState.guild ?? newState.guild;
    const connection = getVoiceConnection(guild.id);
    if (!connection) return;

    // Obtener el canal donde está el bot
    const botChannelId = connection.joinConfig.channelId;
    const botChannel = guild.channels.cache.get(botChannelId);
    if (!botChannel) return;

    // Contar miembros humanos en el canal (excluir bots)
    const humanMembers = botChannel.members.filter((m) => !m.user.bot).size;

    if (humanMembers === 0) {
      // Canal vacío — iniciar timer de inactividad
      if (!timers.has(guild.id)) {
        const timer = setTimeout(() => {
          const conn = getVoiceConnection(guild.id);
          if (conn) {
            conn.destroy();
            logger.info(`Bot desconectado por inactividad en ${guild.name}`);
          }
          timers.delete(guild.id);
        }, INACTIVITY_MS);

        timers.set(guild.id, timer);
        logger.info(`Canal vacío en ${guild.name} — desconexión en 10 minutos si nadie se une`);
      }
    } else {
      // Alguien entró — cancelar timer
      if (timers.has(guild.id)) {
        clearTimeout(timers.get(guild.id));
        timers.delete(guild.id);
      }
    }
  },
};

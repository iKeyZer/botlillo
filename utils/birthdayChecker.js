const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('./logger');

async function checkBirthdays(client) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;

  const users = await User.find({ birthdayDay: day, birthdayMonth: month });
  if (!users.length) return;

  const channel = client.channels.cache.get(config.birthdayChannelId);
  if (!channel) {
    logger.warn('Canal de cumpleaños no encontrado.');
    return;
  }

  for (const userData of users) {
    try {
      const guild = client.guilds.cache.get(userData.guildId);
      if (!guild) continue;

      const member = await guild.members.fetch(userData.userId).catch(() => null);
      if (!member) continue;

      const embed = new EmbedBuilder()
        .setTitle('🎉 ¡Feliz Cumpleaños!')
        .setDescription(`¡Hoy es el cumpleaños de <@${userData.userId}>! 🎂\n¡Toda la comunidad te desea un feliz día!`)
        .setColor(0xf5a623)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      // Sumar puntos de cumpleaños
      await User.findByIdAndUpdate(userData._id, { $inc: { birthdayPoints: 50 } });

      // Asignar rol temporal de cumpleaños si está configurado
      if (config.birthdayRoleId) {
        await member.roles.add(config.birthdayRoleId).catch((err) =>
          logger.warn(`No se pudo asignar rol de cumpleaños a ${member.user.tag}: ${err.message}`)
        );

        // Quitar el rol después de 24 horas
        setTimeout(async () => {
          await member.roles.remove(config.birthdayRoleId).catch(() => null);
        }, 24 * 60 * 60 * 1000);
      }

      logger.info(`Cumpleaños procesado para ${member.user.tag}`);
    } catch (err) {
      logger.error(`Error procesando cumpleaños de ${userData.userId}: ${err.message}`);
    }
  }
}

function startBirthdayChecker(client) {
  // Corre todos los días a las 08:00 AM
  cron.schedule('0 8 * * *', () => {
    logger.info('Revisando cumpleaños del día...');
    checkBirthdays(client);
  });

  logger.info('Sistema de cumpleaños activado (08:00 AM diario).');
}

module.exports = { startBirthdayChecker, checkBirthdays };

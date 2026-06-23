const { ChannelType } = require('discord.js');
const logger = require('./logger');

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const timers = new Map();

async function closeThread(thread) {
  try {
    await thread.send('🔒 Hilo cerrado automáticamente por inactividad (30 minutos).');
    await thread.setLocked(true);
    await thread.setArchived(true);
    logger.info(`Hilo cerrado por inactividad: ${thread.name}`);
  } catch {
    // El hilo puede haber sido borrado manualmente
  } finally {
    timers.delete(thread.id);
  }
}

function startInactivityTimer(thread) {
  if (timers.has(thread.id)) clearTimeout(timers.get(thread.id));
  const timer = setTimeout(() => closeThread(thread), INACTIVITY_MS);
  timers.set(thread.id, timer);
}

function resetInactivityTimer(thread) {
  if (!timers.has(thread.id)) return; // Solo rastrear hilos de debate activos
  startInactivityTimer(thread);
}

function stopTimer(threadId) {
  if (timers.has(threadId)) {
    clearTimeout(timers.get(threadId));
    timers.delete(threadId);
  }
}

module.exports = { startInactivityTimer, resetInactivityTimer, stopTimer };

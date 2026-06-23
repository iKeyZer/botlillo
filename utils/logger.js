const COLORS = {
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  reset: '\x1b[0m',
};

function timestamp() {
  return new Date().toLocaleString('es-MX', { hour12: false });
}

const logger = {
  info: (msg) => console.log(`${COLORS.info}[${timestamp()}] [INFO]${COLORS.reset} ${msg}`),
  warn: (msg) => console.warn(`${COLORS.warn}[${timestamp()}] [WARN]${COLORS.reset} ${msg}`),
  error: (msg) => console.error(`${COLORS.error}[${timestamp()}] [ERROR]${COLORS.reset} ${msg}`),
};

module.exports = logger;

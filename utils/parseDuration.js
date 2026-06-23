// Convierte strings como "10m", "2h", "1d" a milisegundos
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

// Formatea milisegundos a texto legible
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} segundo(s)`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minuto(s)`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hora(s)`;
  return `${Math.floor(h / 24)} día(s)`;
}

module.exports = { parseDuration, formatDuration };

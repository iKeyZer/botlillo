const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  birthdayDay: { type: Number, min: 1, max: 31, default: null },
  birthdayMonth: { type: Number, min: 1, max: 12, default: null },
  birthdayPoints: { type: Number, default: 0 },
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = model('User', userSchema);

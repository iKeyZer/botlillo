const { Schema, model } = require('mongoose');

const giveawaySchema = new Schema({
  messageId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  hostedBy: { type: String, required: true },
  prize: { type: String, required: true },
  winnerCount: { type: Number, default: 1 },
  endAt: { type: Date, required: true },
  ended: { type: Boolean, default: false },
  winners: { type: [String], default: [] },
});

module.exports = model('Giveaway', giveawaySchema);

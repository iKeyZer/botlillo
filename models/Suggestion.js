const { Schema, model } = require('mongoose');

const suggestionSchema = new Schema({
  guildId: { type: String, required: true },
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  messageId: { type: String, default: null },
  channelId: { type: String, required: true },
  yesVotes: { type: Number, default: 0 },
  noVotes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model('Suggestion', suggestionSchema);

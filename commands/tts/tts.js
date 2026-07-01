const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const gTTS = require('gtts');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

process.env.FFMPEG_PATH = ffmpegPath;

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tts')
    .setDescription('Convierte texto a voz en tu canal de voz')
    .addStringOption((opt) =>
      opt
        .setName('texto')
        .setDescription('Texto a reproducir')
        .setRequired(true)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Debes estar en un canal de voz para usar este comando.',
        ephemeral: true,
      });
    }

    const texto = interaction.options.getString('texto');
    await interaction.reply(`🔊 <@${interaction.user.id}> dice: **${texto}**`);

    const tmpFile = path.join(TEMP_DIR, `${randomUUID()}.mp3`);
    const tts = new gTTS(texto, 'es');

    tts.save(tmpFile, (err) => {
      if (err) {
        interaction.followUp({ content: '❌ Error al generar el audio.', ephemeral: true });
        return;
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(tmpFile);

      connection.subscribe(player);
      player.play(resource);

      const cleanup = () => {
        connection.destroy();
        fs.unlink(tmpFile, () => null);
      };

      player.on(AudioPlayerStatus.Idle, cleanup);
      player.on('error', cleanup);
    });
  },
};

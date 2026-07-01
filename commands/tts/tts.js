const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require('@discordjs/voice');
const gTTS = require('gtts');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

process.env.FFMPEG_PATH = ffmpegPath;

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Un solo player por guild para evitar solapamiento
const players = new Map();

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

    // Verificar si el bot ya está en otro canal
    let connection = getVoiceConnection(interaction.guild.id);
    if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
      const otherChannel = interaction.guild.channels.cache.get(connection.joinConfig.channelId);
      return interaction.reply({
        content: `❌ El bot ya está siendo usado en ${otherChannel ? `**${otherChannel.name}**` : 'otro canal de voz'}. Espera a que quede libre.`,
        ephemeral: true,
      });
    }

    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
    }

    // Reutilizar o crear player para este servidor
    if (!players.has(interaction.guild.id)) {
      players.set(interaction.guild.id, createAudioPlayer());
      connection.subscribe(players.get(interaction.guild.id));
    }

    const player = players.get(interaction.guild.id);
    const tmpFile = path.join(TEMP_DIR, `${randomUUID()}.mp3`);
    const tts = new gTTS(texto, 'es');

    tts.save(tmpFile, (err) => {
      if (err) {
        interaction.followUp({ content: '❌ Error al generar el audio.', ephemeral: true });
        return;
      }

      const resource = createAudioResource(tmpFile);
      player.play(resource);

      // Solo eliminar el archivo temporal al terminar, no desconectar
      player.once(AudioPlayerStatus.Idle, () => {
        fs.unlink(tmpFile, () => null);
      });

      player.once('error', () => {
        fs.unlink(tmpFile, () => null);
      });
    });
  },
};

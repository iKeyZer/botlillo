const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const gTTS = require('gtts');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

process.env.FFMPEG_PATH = ffmpegPath;

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

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

    // Verificar si el bot ya está en otro canal
    let connection = getVoiceConnection(interaction.guild.id);
    if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
      const otherChannel = interaction.guild.channels.cache.get(connection.joinConfig.channelId);
      return interaction.reply({
        content: `❌ El bot ya está siendo usado en ${otherChannel ? `**${otherChannel.name}**` : 'otro canal de voz'}. Espera a que quede libre.`,
        ephemeral: true,
      });
    }

    // Crear nueva conexión si no existe
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      // Limpiar player al desconectar para que se cree uno nuevo la próxima vez
      connection.on(VoiceConnectionStatus.Destroyed, () => {
        players.delete(interaction.guild.id);
      });
    }

    // Crear player fresco si no existe o si la conexión es nueva
    if (!players.has(interaction.guild.id)) {
      const player = createAudioPlayer();
      players.set(interaction.guild.id, player);
      connection.subscribe(player);
    }

    const player = players.get(interaction.guild.id);

    await interaction.reply(`🔊 <@${interaction.user.id}> dice: **${texto}**`);

    const tmpFile = path.join(TEMP_DIR, `${randomUUID()}.mp3`);
    const tts = new gTTS(texto, 'es');

    tts.save(tmpFile, (err) => {
      if (err) {
        interaction.followUp({ content: '❌ Error al generar el audio.', ephemeral: true });
        return;
      }

      const resource = createAudioResource(tmpFile);
      player.play(resource);

      player.once(AudioPlayerStatus.Idle, () => {
        fs.unlink(tmpFile, () => null);
      });

      player.once('error', () => {
        fs.unlink(tmpFile, () => null);
      });
    });
  },
};

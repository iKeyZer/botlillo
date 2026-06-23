const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const Suggestion = require('../../models/Suggestion');
const config = require('../../config/config');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerencia')
    .setDescription('Envía una sugerencia a la comunidad')
    .addStringOption((opt) =>
      opt
        .setName('texto')
        .setDescription('Tu sugerencia')
        .setRequired(true)
        .setMaxLength(1000)
    ),

  async execute(interaction) {
    const texto = interaction.options.getString('texto');
    const author = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.guild.channels.cache.get(config.suggestionsChannelId);
    if (!channel) {
      return interaction.editReply('No se encontró el canal de sugerencias. Revisa la configuración.');
    }

    const embed = new EmbedBuilder()
      .setTitle('💡 Nueva Sugerencia')
      .setDescription(texto)
      .setColor(0x5865f2)
      .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
      .addFields(
        { name: '✅ A favor', value: '0', inline: true },
        { name: '❌ En contra', value: '0', inline: true },
        { name: 'Estado', value: '⏳ Pendiente', inline: true }
      )
      .setFooter({ text: `ID del autor: ${author.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sugerencia_debatir')
        .setLabel('💬 Debatir')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await channel.send({ embeds: [embed], components: [row] });

    await msg.react('✅');
    await msg.react('❌');

    const suggestion = await Suggestion.create({
      guildId: interaction.guild.id,
      authorId: author.id,
      content: texto,
      messageId: msg.id,
      channelId: channel.id,
    });

    logger.info(`Nueva sugerencia creada: ${suggestion._id} por ${author.tag}`);

    await interaction.editReply('✅ Tu sugerencia ha sido enviada correctamente.');
  },
};

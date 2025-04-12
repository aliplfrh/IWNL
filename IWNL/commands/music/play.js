import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { GuildMusicManager } from '../../utils/GuildMusicManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from a given URL or search term.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The URL or search term of the song to play')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect), // Required permission for user
    category: 'music',
    async execute(interaction) {
        const input = interaction.options.getString('input');
        const musicManager = interaction.client.musicManagers.get(interaction.guildId);

        if (!musicManager) {
            return interaction.reply({ content: 'Music manager not found. Please try again later.', ephemeral: true });
        }

        try {
            await musicManager.play(input);
            await interaction.reply({ content: `Now playing: **${input}**`, ephemeral: false });
        } catch (error) {
            console.error('Error playing music:', error);
            await interaction.reply({ content: 'There was an error trying to play the music.', ephemeral: true });
        }
    },
};
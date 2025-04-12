import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the currently playing music.'),
    category: 'music',
    async execute(interaction, musicManager) {
        if (!musicManager) {
            return interaction.reply({ content: 'Music manager not found. Please ensure you are in a voice channel.', ephemeral: true });
        }

        musicManager.stop(); // Assuming stop method exists in GuildMusicManager

        await interaction.reply({ content: 'Music playback has been stopped.', ephemeral: true });
    },
};
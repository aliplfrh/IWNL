import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjusts the volume of the music playback.')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),
    category: 'music',
    async execute(interaction) {
        const level = interaction.options.getInteger('level');

        // Assuming you have a way to access the music manager for the guild
        const musicManager = interaction.client.musicManagers.get(interaction.guildId);
        if (!musicManager) {
            return interaction.reply({ content: 'No music is currently playing in this server.', ephemeral: true });
        }

        musicManager.setVolume(level); // Adjust the volume in your music manager logic

        await interaction.reply({ content: `Volume has been set to ${level}.`, ephemeral: true });
    },
};
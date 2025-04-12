import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the currently playing track.'),
    category: 'music',
    async execute(interaction) {
        const musicManager = interaction.client.musicManagers.get(interaction.guildId);
        
        if (!musicManager) {
            return interaction.reply({ content: 'There is no music playing in this server.', ephemeral: true });
        }

        const success = musicManager.skip();

        if (success) {
            await interaction.reply({ content: 'Skipped to the next track!', ephemeral: false });
        } else {
            await interaction.reply({ content: 'There was an error skipping the track.', ephemeral: true });
        }
    },
};
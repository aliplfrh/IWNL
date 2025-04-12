import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.'),
    category: 'music',
    async execute(interaction) {
        const musicManager = interaction.client.musicManagers.get(interaction.guildId);
        
        if (!musicManager || !musicManager.queue.length) {
            return interaction.reply({ content: 'The queue is currently empty.', ephemeral: true });
        }

        const queueList = musicManager.queue.map((track, index) => `${index + 1}. ${track.title}`).join('\n');
        
        await interaction.reply({ content: `Current Queue:\n${queueList}`, ephemeral: true });
    },
};
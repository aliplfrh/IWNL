import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Displays the currently playing track.'),
    category: 'music',
    async execute(interaction) {
        const musicManager = interaction.client.musicManagers.get(interaction.guildId);
        
        if (!musicManager || !musicManager.queue.length) {
            return interaction.reply({ content: 'There is currently no music playing.', ephemeral: true });
        }

        const currentTrack = musicManager.queue[0]; // Assuming the first track is the currently playing one

        const nowPlayingEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // Blue color
            .setTitle('Now Playing')
            .addFields(
                { name: 'Title', value: currentTrack.title, inline: true },
                { name: 'Requested by', value: currentTrack.requestedBy.tag, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [nowPlayingEmbed] });
    },
};
import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Makes the bot leave the voice channel.'),
    category: 'music',
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to use this command.', ephemeral: true });
        }

        const botMember = interaction.guild.members.me;

        if (botMember.voice.channel !== voiceChannel) {
            return interaction.reply({ content: 'I am not in your voice channel.', ephemeral: true });
        }

        await voiceChannel.leave();
        await interaction.reply({ content: 'I have left the voice channel.', ephemeral: false });
    },
};
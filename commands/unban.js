import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a member from the server.')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // Required permission for user
        .setDMPermission(false), // Cannot be used in DMs
    category: 'moderation',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = 'No reason provided'; // You can modify this to accept a reason if needed

        try {
            await interaction.guild.members.unban(userId, reason);
            await interaction.reply({ content: `Successfully unbanned <@${userId}>.`, ephemeral: true });
        } catch (error) {
            console.error('Error unbanning member:', error);
            await interaction.reply({ content: 'An error occurred while trying to unban the member. Please ensure the user ID is correct.', ephemeral: true });
        }
    },
};
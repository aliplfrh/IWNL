import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // Required permission for user
        .setDMPermission(false), // Cannot be used in DMs
    category: 'moderation',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(targetUser.id);

        if (!member) {
            return interaction.reply({ content: 'That user isn\'t in this server.', ephemeral: true });
        }

        // Permission checks (Self, Target vs Executor, Target vs Bot)
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot ban yourself!', ephemeral: true });
        }
        if (member.id === interaction.client.user.id) {
            return interaction.reply({ content: 'I cannot ban myself!', ephemeral: true });
        }
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot ban the server owner!', ephemeral: true });
        }

        // Check role hierarchy (Executor vs Target)
        const executorMember = interaction.member;
        if (member.roles.highest.position >= executorMember.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'You cannot ban someone with an equal or higher role than you.', ephemeral: true });
        }

        // Check role hierarchy (Bot vs Target)
        const botMember = interaction.guild.members.me; // Fetches the bot's member object
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'I do not have the `Ban Members` permission.', ephemeral: true });
        }
        if (member.roles.highest.position >= botMember.roles.highest.position) {
            return interaction.reply({ content: 'I cannot ban someone with an equal or higher role than me.', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban that user. Check my permissions and role position.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Attempt to DM the user first
            try {
                await targetUser.send(`You have been banned from **${interaction.guild.name}**. Reason: ${reason}`);
            } catch (dmError) {
                console.warn(`Could not DM user ${targetUser.tag} about ban.`);
                await interaction.followUp({ content: `Could not DM ${targetUser.tag}, but proceeding with ban.`, ephemeral: true });
            }

            await member.ban({ reason: `${reason} (Banned by ${interaction.user.tag})` });

            const banEmbed = new EmbedBuilder()
                .setColor(0xFF0000) // Red color
                .setTitle('Member Banned')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'Banned User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [banEmbed] });

        } catch (error) {
            console.error('Error banning member:', error);
            await interaction.editReply({ content: 'An error occurred while trying to ban the member.', ephemeral: true });
        }
    },
};
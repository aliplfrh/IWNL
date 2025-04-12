import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),
    category: 'moderation',
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(targetUser.id);

        if (!member) {
            return interaction.reply({ content: 'That user isn\'t in this server.', ephemeral: true });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot kick yourself!', ephemeral: true });
        }
        if (member.id === interaction.client.user.id) {
            return interaction.reply({ content: 'I cannot kick myself!', ephemeral: true });
        }
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot kick the server owner!', ephemeral: true });
        }

        const executorMember = interaction.member;
        if (member.roles.highest.position >= executorMember.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ content: 'You cannot kick someone with an equal or higher role than you.', ephemeral: true });
        }

        const botMember = interaction.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'I do not have the `Kick Members` permission.', ephemeral: true });
        }
        if (member.roles.highest.position >= botMember.roles.highest.position) {
            return interaction.reply({ content: 'I cannot kick someone with an equal or higher role than me.', ephemeral: true });
        }

        if (!member.kickable) {
            return interaction.reply({ content: 'I cannot kick that user. Check my permissions and role position.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            try {
                await targetUser.send(`You have been kicked from **${interaction.guild.name}**. Reason: ${reason}`);
            } catch (dmError) {
                console.warn(`Could not DM user ${targetUser.tag} about kick.`);
                await interaction.followUp({ content: `Could not DM ${targetUser.tag}, but proceeding with kick.`, ephemeral: true });
            }

            await member.kick(`${reason} (Kicked by ${interaction.user.tag})`);

            const kickEmbed = new EmbedBuilder()
                .setColor(0xFF470F)
                .setTitle('Member Kicked')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'Kicked User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [kickEmbed] });

        } catch (error) {
            console.error('Error kicking member:', error);
            await interaction.editReply({ content: 'An error occurred while trying to kick the member.', ephemeral: true });
        }
    },
};
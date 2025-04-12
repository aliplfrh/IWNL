import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears a specified number of messages from the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to clear')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),
    category: 'moderation',
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
        }

        // Clear messages
        const fetched = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(fetched, true).catch(error => {
            console.error('Error clearing messages:', error);
            return interaction.reply({ content: 'There was an error trying to clear messages in this channel.', ephemeral: true });
        });

        return interaction.reply({ content: `Successfully cleared ${fetched.size} messages.`, ephemeral: true });
    },
};
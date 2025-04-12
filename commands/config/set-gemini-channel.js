import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', '..', 'config.json');

function readConfig() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const defaultConfig = { geminiChannelId: null };
            writeConfig(defaultConfig);
            return defaultConfig;
        } else {
            console.error('Error reading config file:', error);
            return { geminiChannelId: null };
        }
    }
}

function writeConfig(configData) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    } catch (error) {
        console.error('Error writing config file:', error);
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('set-gemini-channel')
        .setDescription('Sets the channel for interacting with the Gemini AI.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The text channel to designate for Gemini chat')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    category: 'config',
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');

        if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
        }

        try {
            const config = readConfig();
            config.geminiChannelId = targetChannel.id;
            writeConfig(config);

            interaction.client.config.geminiChannelId = targetChannel.id;

            const embed = new EmbedBuilder()
                .setColor(0x4A90E2)
                .setTitle('Gemini Channel Set')
                .setDescription(`Successfully set ${targetChannel} as the channel for Gemini interactions.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            console.log(`Gemini channel set to: ${targetChannel.name} (${targetChannel.id}) in guild ${interaction.guild.name}`);
        } catch (error) {
            console.error('Error setting Gemini channel:', error);
            await interaction.reply({ content: 'An error occurred while saving the channel setting.', ephemeral: true });
        }
    },
};
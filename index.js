import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GuildMusicManager } from './utils/GuildMusicManager.js';

config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('Error: DISCORD_TOKEN environment variable not found. Make sure you have a .env file.');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('Loading commands...');
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.default;

        if (command && 'data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(` -> Loaded command: ${command.data.name}`);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
console.log('Finished loading commands.');

client.musicManagers = new Collection();

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    client.user.setActivity('music and moderating', { type: 'PLAYING' });
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        await interaction.reply({ content: 'Error: Command not found!', ephemeral: true });
        return;
    }

    let musicManager;
    if (command.category === 'music') {
        if (!client.musicManagers.has(interaction.guildId)) {
            client.musicManagers.set(interaction.guildId, new GuildMusicManager(client));
        }
        musicManager = client.musicManagers.get(interaction.guildId);
    }

    try {
        await command.execute(interaction, musicManager);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on(Events.GuildDelete, guild => {
    const musicManager = client.musicManagers.get(guild.id);
    if (musicManager) {
        musicManager.destroy();
        client.musicManagers.delete(guild.id);
        console.log(`Cleaned up music manager for left guild: ${guild.name}`);
    }
});

client.login(token);
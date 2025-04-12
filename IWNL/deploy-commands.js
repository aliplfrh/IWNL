import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10'; 
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; 

if (!token || !clientId) {
    console.error('Error: DISCORD_TOKEN or CLIENT_ID environment variable not found.');
    process.exit(1);
}

const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('Reading command files...');
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        try {
            const commandModule = await import(filePath);
            const command = commandModule.default; 
            if (command && command.data) {
                commands.push(command.data.toJSON());
                console.log(` -> Found command: ${command.data.name}`);
            } else {
                console.warn(`[WARNING] Command at ${filePath} is missing data export.`);
            }
        } catch (error) {
            console.error(`Error loading command file ${filePath}:`, error);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let route;
        if (guildId) {
            route = Routes.applicationGuildCommands(clientId, guildId);
            console.log(`Registering commands for guild: ${guildId}`);
        } else {
            route = Routes.applicationCommands(clientId);
            console.log('Registering commands globally.');
        }

        const data = await rest.put(route, { body: commands });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();
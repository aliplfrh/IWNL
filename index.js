import { Client, GatewayIntentBits, Collection, Events, Partials, ChannelType, EmbedBuilder } from 'discord.js';
import { config as dotenvConfig } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.channel.id !== client.config.geminiChannelId) return;

    // Example: Bot replies to messages in the specified channel
    await message.channel.send(`Hello, ${message.author.username}!`);
});

client.on(Events.MessageCreate, (message) => {
    console.log(`Received message: ${message.content} in channel: ${message.channel.id}`);
});

// --- Load Environment Variables ---
dotenvConfig();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN environment variable not found.');
    process.exit(1);
}
if (!GEMINI_API_KEY) {
    console.warn('[WARNING] GEMINI_API_KEY environment variable not found. Gemini features will be disabled.');
}

// --- File Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'config.json');

// --- Configuration Loading ---
let botConfig = { geminiChannelId: null };
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            botConfig = JSON.parse(data);
            console.log('Loaded configuration from config.json');
        } else {
            // Create default config if it doesn't exist
            fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2));
            console.log('Created default config.json');
        }
    } catch (error) {
        console.error('Error loading or creating config.json:', error);
    }
}
loadConfig(); // Initial load

// --- Discord Client Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Ensure this is enabled in the Developer Portal
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message],
});

client.config = botConfig; // Attach config to client for easy access in commands
client.commands = new Collection();

// --- Gemini AI Setup ---
let genAI = null;
let geminiModel = null;
const conversationHistory = new Map(); // Store history per channel
const MAX_HISTORY = 10; // Keep last 10 turns (user + model)

if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest', // Adjust model name as needed
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ]
        });
        console.log('Google Generative AI initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize Google Generative AI:', error);
        genAI = null; // Disable Gemini features if init fails
    }
} else {
    console.log('Gemini features disabled (no API key provided).');
}

// --- Command Loading ---
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);
console.log('Loading commands...');
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const commandModule = await import(`file://${filePath}`);
                const command = commandModule.default;
                if (command && 'data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(` -> Loaded command: ${command.data.name}`);
                } else {
                    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`Error loading command ${filePath}:`, error);
            }
        }
    }
}
console.log('Finished loading commands.');

// --- Event Handlers ---
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    client.user.setActivity('AI chats & tunes', { type: 'PLAYING' });
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        await interaction.reply({ content: 'Error: Command not found!', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const replyOptions = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;
    loadConfig();
    if (!client.config.geminiChannelId || message.channel.id !== client.config.geminiChannelId) {
        return;
    }
    if (!message.content || message.content.startsWith('/')) return;

    if (!genAI || !geminiModel) {
        console.log('Received message in Gemini channel, but Gemini AI is not configured/initialized.');
        return;
    }

    console.log(`Received message for Gemini in #${message.channel.name}: "${message.content}"`);
    await message.channel.sendTyping();

    try {
        if (!conversationHistory.has(message.channel.id)) {
            conversationHistory.set(message.channel.id, []);
        }
        const history = conversationHistory.get(message.channel.id);

        history.push({ role: 'user', parts: [{ text: message.content }] });

        while (history.length > MAX_HISTORY) {
            history.shift();
        }

        const chat = geminiModel.startChat({
            history: history.slice(0, -1),
        });

        const result = await chat.sendMessage(message.content);
        const response = await result.response;
        const responseText = response.text();

        history.push({ role: 'model', parts: [{ text: responseText }] });

        while (history.length > MAX_HISTORY) {
            history.shift();
        }

        if (responseText.length > 2000) {
            const chunks = responseText.match(/(.|\r?\n){1,2000}/g);
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else if (responseText.length > 0) {
            await message.reply(responseText);
        } else {
            const blockReason = response.promptFeedback?.blockReason;
            let replyMsg = "I couldn't generate a response.";
            if (blockReason) {
                replyMsg += ` (Reason: ${blockReason})`;
            }
            await message.reply({ content: replyMsg });
        }
    } catch (error) {
        console.error(`Error processing Gemini message in channel ${message.channel.id}:`, error);
        let errorMsg = 'Sorry, I encountered an error while talking to the AI.';
        if (error.message && error.message.includes('429')) {
            errorMsg = 'The AI is a bit busy right now, please try again in a moment.';
        } else if (error.message && error.message.includes('SAFETY')) {
            errorMsg = 'My safety filters prevented me from generating a response to that.';
        }
        try {
            await message.reply(errorMsg);
        } catch (replyError) {
            console.error('Failed to send error reply to Discord:', replyError);
        }
    }
});

// --- Login ---
client.login(DISCORD_TOKEN);
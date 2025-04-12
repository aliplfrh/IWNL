# IWNL Discord Bot

## Description
IWNL is a Discord bot built using JavaScript (Node.js) and the discord.js library. It features moderation tools and music playback functionality, allowing server administrators to manage members and provide an engaging music experience for users.

## Features
- **Moderation Commands**: 
  - Kick members from the server.
  - Ban members from the server.
  - Clear messages in a channel.
  - Unban members from the server.

- **Music Commands**:
  - Play music from various sources.
  - Skip the currently playing track.
  - Stop music playback.
  - Display the current music queue.
  - Make the bot leave the voice channel.
  - Show the currently playing track.
  - Adjust the volume of the music playback.

## Requirements
- Node.js (v16.9.0 or newer recommended)
- npm or yarn
- FFmpeg (installed and in PATH)
- yt-dlp (installed and in PATH)

## Installation
1. Clone the repository or download the project files.
2. Navigate to the project directory.
3. Run `npm install` to install the required dependencies.
4. Create a `.env` file in the root directory and add your Discord bot token and client ID.
5. Run `node deploy-commands.js` to register the slash commands with Discord.
6. Start the bot using `node index.js`.

## Usage
- Use the `/kick` command to kick a member from the server.
- Use the `/ban` command to ban a member from the server.
- Use the `/clear` command to delete messages in a channel.
- Use the `/unban` command to unban a member.
- Use the music commands to manage playback and queues.

## Important Notes
- Ensure that the bot has the necessary permissions in your Discord server.
- Always keep your bot token secure and do not share it publicly. Use environment variables to manage sensitive information.

## Contributing
Contributions are welcome! Feel free to submit issues or pull requests to improve the bot's functionality.
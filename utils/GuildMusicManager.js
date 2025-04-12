import { AudioPlayer, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { Collection } from 'discord.js';

export class GuildMusicManager {
    constructor(client) {
        this.client = client;
        this.queue = new Collection(); // Map to hold the music queue for each guild
        this.connection = null; // Voice connection
        this.player = createAudioPlayer(); // Audio player
        this.currentTrack = null; // Currently playing track
    }

    // Join a voice channel
    join(channel) {
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        this.connection.on('stateChange', (oldState, newState) => {
            if (newState.status === 'disconnected') {
                this.cleanup();
            }
        });
    }

    // Leave the voice channel
    leave() {
        if (this.connection) {
            this.connection.destroy();
            this.cleanup();
        }
    }

    // Cleanup resources
    cleanup() {
        this.queue.clear();
        this.currentTrack = null;
        this.connection = null;
    }

    // Add a track to the queue
    enqueue(track) {
        this.queue.set(track.id, track);
    }

    // Play the next track in the queue
    playNext() {
        const nextTrack = this.queue.values().next().value;
        if (nextTrack) {
            this.currentTrack = nextTrack;
            const resource = createAudioResource(nextTrack.url);
            this.player.play(resource);
            this.connection.subscribe(this.player);
            this.queue.delete(nextTrack.id);
        }
    }

    // Get the current track
    getCurrentTrack() {
        return this.currentTrack;
    }

    // Get the queue
    getQueue() {
        return this.queue;
    }
}
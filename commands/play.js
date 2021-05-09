const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const queue = new Map();
module.exports = {
    name: 'play',
    aliases: ['skip', 'stop'],
    cooldown: 0,
    description: 'Information about the arguments provided.',
    execute: async function (message, args, client, cmd, Discord) {
        const server_queue = queue.get(message.guild.id);
        if (cmd === 'lg') {
            const voice_channel = message.member.voice.channel;
            if (!voice_channel) return message.channel.send('WARNING : YOU HAVE TO FIRST JOIN A CHANNEL TO EXECUTE THIS COMMEND')
            const permissions = voice_channel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT')) return message.channel.send('WARNING : YOU DONT HAVE THE CORRECT PERMISSION');
            if (!permissions.has('SPEAK')) return message.channel.send('WARNING : YOU DONT HAVE THE CORRECT PERMISSION');

            if (!args.length)  return message.channel.send('You have to send name music after commend ex: !play eminem my self')
            let song = {};
            if (ytdl.validateURL(args[0])) {
                const song_info = await ytdl.getInfo(args[0]);
                song = {
                    description: song_info.videoDetails.description,
                    url: song_info.videoDetails.video_url
                }
            }
            else {
                const video_finder = async (query) => {
                    const videoResult = await  ytSearch(query);
                    return (videoResult.videos.length > 1) ? videoResult.videos[0] : null
                }
                const video = await video_finder(args.join(' '))
                if (video) {
                    song = {
                        description: video.description,
                        url: video.url,
                        thumbnail: video.thumbnail,
                        image: video.image,
                        timestamp: video.timestamp,
                        views: video.views
                    }
                } else {
                    message.channel.send('ERROR : the music not exist')
                }
            }
            if (!server_queue) {
                const queue_contractor = {
                    voice_channel: voice_channel,
                    text_channel: message.channel,
                    connection: null,
                    songs: []
                }
                queue.set(message.guild.id, queue_contractor);
                queue_contractor.songs.push(song);

                try {
                    const connection = await voice_channel.join();
                    queue_contractor.connection = connection;
                    video_player(message.guild, queue_contractor.songs[0], Discord, server_queue, message);
                } catch (err) {
                    queue.delete(message.guild.id);
                    message.channel.send('There was a error connection');
                    throw err
                }
            }
            else {
                server_queue.songs.push(song);
                return message.channel.send(`${song.description} added in queue`);
            }
        }
        else if (cmd === 'lgstop') {
            video_stop(message, server_queue);
        } else if (cmd === 'lgskip') {
            video_skip(message, server_queue);
        }

    }
}

const video_player = async (guild, song, Discord, sq, msg) => {
    const song_queue = queue.get(guild.id);
    if (!song) {
        song_queue.voice_channel.leave();
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, {filter: 'audioonly'});
    song_queue.connection.play(stream, {seek: 0, volume: 0.5})
        .on('finish', () => {
            song_queue.songs.shift()
            video_player(guild, song_queue.songs[0], Discord, sq, msg);
        })
    const exampleEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Legend music (best server in discord)')
        .setURL('https://legends.fg1.ir/')
        .setDescription(song.description)
        .setThumbnail(song.thumbnail)
        .setImage(song.image)
        .setTimestamp(song.timestamp)
        .addFields(
            { name: 'music time', value: song.timestamp, inline: true},
            { name: 'views', value: song.views, inline: true });
    await song_queue.text_channel.send({embed: exampleEmbed});
}
const video_skip = async (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this commend');
    if (!server_queue) {
        return message.channel.send('There are no song');
    }
    server_queue.connection.dispatcher.end()
}
const video_stop = async (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this commend');
    server_queue.songs = []
    server_queue.connection.dispatcher.end()
}

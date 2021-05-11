const Discord = require('discord.js');
const prefix = '$lg';
// const prefix = process.env.prefix;
const token = 'ODE3Njk0OTQyMzYwMjQwMTQ5.YENPwg.oqDwzniag-VEzF2K5E0gz-qfCiw';
// const token = process.env.token;

const client = new Discord.Client();
const fs = require('fs');
const cooldowns = new Map()
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
client.on('ready', () => {
    console.log('have fun together in Legends server');
    client.user.setActivity(`for run this bot you have to us first of statement ${process.env.prefix}`);
});
client.on('warn' , info => info);
client.on('error', console.error);
client.on('message', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const command = client.commands.get(cmd) ||
        client.commands.find(a => a.aliases || a.aliases.includes(cmd))

    if (command.cooldown) {
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, Discord.Collection())
        }
        const current_time = new Date();
        const time_stamps = cooldowns.get(command.name);
        const cooldown_amount = (command.cooldown) * 1000;
        if (time_stamps.has(message.author.id)) {
            const expiration_time = time_stamps.get(message.author.id) + cooldown_amount;
            if (current_time < expiration_time) {
                const time_left = (expiration_time - current_time) / 1000;

                return message.reply(`please waite ${time_left.toFixed(1)} more seconds before usning ${command.name}`);
            }
        }
        time_stamps.set(message.author.id, current_time);
        setTimeout(() => time_stamps.delete(message.author.id), cooldown_amount);
    }

    try {
        await command.execute(message, args, client, cmd, Discord);
    } catch (error) {
        console.error(error);
        await message.reply('there was an error trying to execute that command!');
    }
});
client.login(token);

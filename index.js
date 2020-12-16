const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();

let participants = new Map();

client.once('ready', () => {
    console.log('IEEE Attendance Bot is online.');
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // oldState: the voice state before the update
    // newState: the voice state after the update

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const name = newState.member.nickname;
    const date = new Date();
    const time = date.getTime();

    if (oldChannel === null && newChannel !== null) {
        // user joins a channel
        if (newChannel.name === 'Presentation') {
            if (participants.has(name)) {
                let temp = participants.get(name);
                temp.push(time);
                participants.set(name, temp);
            } else {
                participants.set(name, [time]);
            }
        }
    } else if (newChannel === null) {
        // user leaves a voice channel 
        if (oldChannel.name === 'Presentation') {
            let temp = participants.get(name);
            temp.push(time);
            participants.set(name, temp);
        }
    } else {
        // user switched channels 
    }
});

client.on('message', message => {
    const command = message.content;
    if (command.includes('!save')) {
        if (command.trim().length > 5) {
            const eventName = command.substring(5).trim();
            
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const eventDate = mm + '/' + dd + '/' + yyyy;

            /* Preprocessing. If a user only has three time stamps,
             * add a new one that is the current time, assuming that
             * the user who types !save is typing it at the end 
             * of the meeting. */
            for (let name of participants.keys()) {
                let temp = participants.get(name);
                if (temp.length % 2 != 0) {
                    temp.push(today.getTime());
                }
            }

            console.log(eventName + ' ' + eventDate + ':');
            participants.forEach(entry => console.log(entry));

            for (let entry of participants.entries()) {
                fs.appendFile('attendance.csv', entry[0] + ', ' + entry[1] + '\n', (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        } else {
            message.channel.send('Make sure to include an event title when you use save.');
        }
    }
});

client.login('TOKEN');
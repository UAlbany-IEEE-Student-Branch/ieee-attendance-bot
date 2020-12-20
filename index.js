const Discord = require('discord.js');
const fs = require('fs');
const token = require('./config.json');

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

    // since on the ieee discord we like people to use their real names, use nicknames,
    // but if they don't have a nickname then use their username. 
    let name = newState.member.nickname;
    if (name === null || name === 'null') {
        name = newState.member.user.username;
    }
    const date = new Date();
    const time = date.getTime();

    if (oldChannel === null && newChannel !== null) {
        // user joins a channel
        if (newChannel.name === 'Presentation' ||  newChannel.name === 'Project Development Voice') {
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
             
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const eventDate = mm + '/' + dd + '/' + yyyy;

            // take the name from the user's input but append the date
            const eventName = command.substring(5).trim() + eventDate;

            /* Preprocessing. If a user only has odd number of time stamps,
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

            let data;
            if (fs.existsSync('attendance.json')) {
                console.log('attendance found');
                data = fs.readFileSync('attendance.json');
            } else {
                console.log('attendance DNE, making file...')
                let obj = '{}';
                fs.writeFileSync('attendance.json', obj);
                data = fs.readFileSync('attendance.json');
            }
            
            let attendance = JSON.parse(data);
            for (let entry of participants.entries()) {
                // entry[0] is the name
                // entry[1] holds the timestamps
                console.log(entry[0] + ': ' + entry[1]);
                if (attendance.hasOwnProperty(entry[0])) {
                    attendance[entry[0]][eventName] = entry[1];
                } else {
                    attendance[entry[0]] = {};
                    attendance[entry[0]][eventName] = entry[1];
                }
            }
            data = JSON.stringify(attendance, null, 2);
            fs.writeFile('attendance.json', data, (err) => {
                if (err){
                    console.log(err.message);
                    throw err;
                }
            });
            console.log('Data written to file.');
        } else {
            message.channel.send('Make sure to include an event title when you use save.');
        }
    }
});

client.login(token);
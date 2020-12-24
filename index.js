const Discord = require('discord.js');
const fs = require('fs');
const { token } = require('./config.json');

const client = new Discord.Client();

// a map containing 
let participants = new Map();

function addMemberToParticipants(name, timestamp) {
    if (participants.has(name)) {
        // update the timestamps the user maps to
        let oldEntry = participants.get(name);
        oldEntry.push(timestamp);
        participants.set(name, oldEntry);
    } else {
        // add a new entry for this user
        participants.set(name, [timestamp]);
    }
}

function sendAttendanceToMessageAuthor(message) {
    message.author.send('Here you go, buddy: ', {
        files: [
            './attendance.json'
        ]
    });
    message.channel.send(`Attendance sent to ${message.author.username}`);
}

client.once('ready', () => {
    console.log(`${client.user.username} is online.`);
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
    const timestamp = date.getTime();

    if (oldChannel === null && newChannel !== null) {
        // user joins a channel
        if (newChannel.name === 'Presentation' ||  newChannel.name === 'Project Development Voice') {
            addMemberToParticipants(name, timestamp);
        }
    } else if (newChannel === null) {
        // user leaves a voice channel 
        if (oldChannel.name === 'Presentation') {
            addMemberToParticipants(name, timestamp);
        }
    } else {
        // user switched channels 
    }
});

client.on('message', message => {
    const command = message.content;

    // make sure the message is in the bot-spam channel and 
    // that the bot doesn't react to its own messages
    if (message.channel.id === '685315837015752723' && message.author.id !== '788546844291629077') {

        if (command.includes('!save')) {
        
            // make sure there is an event name with the command
            if (command.trim().length > 5) {
                
                const today = new Date();
                const dd = String(today.getDate()).padStart(2, '0');
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const yyyy = today.getFullYear();
                const eventDate = mm + '/' + dd + '/' + yyyy;

                // take the name from the user's input but append the date
                const eventName = command.substring(5).trim() + ' ' + eventDate;

                /* 
                 * Preprocessing: if a user only has an odd number of time stamps,
                 * add a new one that is the time now, assuming that
                 * the user who types !save is typing it at the end 
                 * of the meeting. 
                 * */
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

                    // check if the attendance already has this member
                    if (attendance.hasOwnProperty(entry[0])) {
                        attendance[entry[0]][eventName] = entry[1];
                    } else {

                        // make a new entry for this member that is an object
                        // that maps event names to timestamps
                        attendance[entry[0]] = {};
                        attendance[entry[0]][eventName] = entry[1];
                    }
                }
                data = JSON.stringify(attendance, null, 2);
                fs.writeFile('attendance.json', data, (err) => {
                    if (err){
                        message.channel.send(`Error writing to attendance: ${err.message}`);
                        console.log(err.message);
                        throw err;
                    }
                });

                message.channel.send('Data written to file.');

                sendAttendanceToMessageAuthor(message);
            } else {
                message.channel.send('Please retry. Make sure to include an event title when you use save.\nUsage: !save <event title>');
            }
        }

        if (command.includes('!start')) {

            // just represents whether the command was ok or not
            let commandValid = true;
           
            let timestamp;
            if (command.trim().length > 6) {

                // if the user includes the starting time, use that for the timestamp
                timestamp = Date.parse(command.substring(6).trim());
                if (isNaN(timestamp) || timestamp < 0) {
                    message.channel.send('Please retry. Incorrect date format.\nExample: !start 01 Jan 1970 23:59:59 EST');
                    commandValid = false;
                }
            } else {

                // if the user didn't include a date, just use right now  as the starting time
                const date = new Date();
                timestamp = date.getTime();
            }

            if (commandValid) {

                // clear the participants list, prepping the bot for logging the next event. 
                participants.clear();

                // get a list of voice channels
                const voiceChannels = message.guild.channels.cache.filter((channel) => channel.type === 'voice');
                
                // add participants to the list if they're already in the voice channel
                for (const [id, voiceChannel] of voiceChannels) {
                    switch (voiceChannel.name) {
                        case 'Presentation':
                        case 'Project Development Voice':
                            if (voiceChannel.members.size >= 1) {
                                voiceChannel.members.map((member, userId) => {
                                    let name = member.nickname;
                                    if (name === null || name === 'null') {
                                        name = member.user.username;
                                    }

                                    addMemberToParticipants(name, timestamp);
                                });
                            }
                            break;
                    }
                }
            }
        }

        if (command === '!get') {
            if (fs.existsSync('attendance.json')) {
                sendAttendanceToMessageAuthor(message);
            } else {
                message.channel.send("Couldn't find attendance.");
            }
        }
    }
});

client.login(token);
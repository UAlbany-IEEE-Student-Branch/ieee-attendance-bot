const Discord = require('discord.js');
const fs = require('fs');
const { token } = require('./config.json');

const client = new Discord.Client();

// a map containing participants in a meeting and their entry
// and exit timestamps
let participants = new Map();

// a list of voice channels to watch for activity 
const listenedVoiceChannels = [
    'Presentation', 
    'Project Development Voice', 
    'Coding Night', 
    'Officers Voice', 
    'Voice 1', 
    'Workshop',
];

// commands that the bot responds to
const SAVE_COMMAND = '!save';
const START_COMMAND = '!start';
const GET_COMMAND = '!get';
const ADD_COMMAND = '!add';

// users that the bot listens to, outside of users who have the EBoard role
let authorizedUsers = ['346836689529995274'];

const EBOARD_ROLE_ID = '685303937611333648';

// text channels that the bot will listen to 
const authorizedTextChannels = ["685315837015752723"];

// represents if the bot is listening for attendance
let isListening = false;

function addMemberToParticipants(member, timestamp) {

    // get member's info
    const nickname = member.nickname;
    const username = member.user.username;
    const userId = member.user.id;
    const memberId = member.id;

    if (participants.has(userId)) {
        // update the timestamps the user maps to
        let userDetail = participants.get(userId);
        userDetail.timestamps.push(timestamp);
        participants.set(userId, userDetail);
    } else {
        // add a new entry for this user
        const userDetail = {
            nickname: nickname,
            username: username,
            timestamps: [timestamp],
        };

        participants.set(userId, userDetail);
    }
}

function sendAttendanceToMessageAuthor(message) {
    message.author.send('Here you go, buddy: ', {
        files: [
            './attendance.json'
        ],
    });
    message.channel.send(`Attendance sent to ${message.author.username}`);
}

function handleSave(message, content) {

    if (!isListening) {
        message.channel.send('I\'m not listening lalalalalalalala');
        return;
    }
        
    // make sure there is an event name with the command
    if (content.trim().length > 5) {
        
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const eventDate = mm + '/' + dd + '/' + yyyy;

        // take the name from the user's input but append the date
        const eventName = content.substring(5).trim() + ' ' + eventDate;

        /* 
         * Preprocessing: if a user only has an odd number of time stamps,
         * add a new one that is the time now, assuming that
         * the user who types !save is typing it at the end 
         * of the meeting. 
         * */
        for (let name of participants.keys()) {
            let temp = participants.get(name);
            if (temp.timestamps.length % 2 != 0) {
                temp.timestamps.push(today.getTime());
            }
        }

        console.log(eventName + ' ' + eventDate + ':');

        // try reading the attendance  
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
        
        // convert JSON to object
        let attendance = JSON.parse(data);

        // add to the object
        for (let entry of participants.entries()) {
            // entry[0] is the name
            // entry[1] holds the timestamps
            console.log(`${entry[1].username} aka ${entry[1].nickname}: ${entry[1].timestamps}`)

            // update the entry in the attendance if the user has one, otherwise make an entry
            if (attendance.hasOwnProperty(entry[0])) {
                if (attendance[entry[0]].usernames.includes(entry[1].username) === false) {
                    attendance[entry[0]].usernames.push(entry[1].username);
                }
                if (attendance[entry[0]].nicknames.includes(entry[1].nickname) === false) {
                    attendance[entry[0]].nicknames.push(entry[1].nickname);
                }
            } else {

                // make a new entry for this member that is an object that maps
                // userId to an object containing observed usernames, nicknames, and attendance
                attendance[entry[0]] = {};
                attendance[entry[0]]["nicknames"] = [entry[1]["nickname"]];
                attendance[entry[0]]["usernames"] = [entry[1]["username"]];
                attendance[entry[0]]["attendance"] = {}; 
            }

            // add the timestamps for this event
            attendance[entry[0]]["attendance"][eventName] = entry[1].timestamps;
        }

        // write to file
        data = JSON.stringify(attendance, null, 2);
        fs.writeFile('attendance.json', data, (err) => {
            if (err){
                message.channel.send(`Error writing to attendance: ${err.message}`);
                console.log(err.message);
                throw err;
            }
        });

        message.channel.send('Data written to file.');

        isListening = false;
        sendAttendanceToMessageAuthor(message);
    } else {
        message.channel.send('Please retry. Make sure to include an event title when you use save.\nUsage: !save <event title>');
    }
}

function handleStart(message, content) {

    if (isListening) {
        message.channel.send("Sorry, I'm already listening!");
        return;
    }

    // just represents whether the command was ok or not
    let commandValid = true;

    let timestamp;
    if (content.trim().length > 6) {

        // if the user includes the starting time, use that for the timestamp
        timestamp = Date.parse(content.substring(6).trim());

        // just do a simple error check/input check, dunno how to make this more robust
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
        const allServerVoiceChannels = message.guild.channels.cache.filter((channel) => channel.type === 'voice');
        
        // add participants to the list if they're already in the voice channel
        for (const [id, voiceChannel] of allServerVoiceChannels) {
            if (listenedVoiceChannels.includes(voiceChannel.name)) {
                if (voiceChannel.members.size >= 1) {
                    voiceChannel.members.map((member, snowflake) => {

                        addMemberToParticipants(member, timestamp);
                    });
                }
            }
        }

        isListening = true;
        message.channel.send('Listening for attendance...');
    }
}

function handleGet(message) {
    if (fs.existsSync('attendance.json')) {
        sendAttendanceToMessageAuthor(message);
    } else {
        message.channel.send("Couldn't find attendance.");
    }
}

function handleAdd(message, content) {
    const pattern = /^\d+$/;
    if (content.trim().length > 4) {
        const userId = content.substring(4).trim();
        if (pattern.test(userId)) {
            authorizedUsers.push(userId);
            message.channel.send(`${userId} can now use the bot.`);
        } else {
            message.channel.send(`${userId} didn't pass the vibe check.`);
        }
    } else {
        message.channel.send('You need to give a user ID as a parameter.');
    }
}

function handleInvalidCommand(message) {
    message.channel.send('Invalid comand, dummy!');
}

client.once('ready', () => {
    console.log(`${client.user.username} is online.`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // oldState: the voice state before the update
    // newState: the voice state after the update

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const date = new Date();
    const timestamp = date.getTime();

    if (oldChannel === null && newChannel !== null) {
        // user joins a channel
        if (listenedVoiceChannels.includes(newChannel.name)) {
            addMemberToParticipants(newState.member, timestamp);
        }
    } else if (newChannel === null) {
        // user leaves a voice channel 
        if (listenedVoiceChannels.includes(oldChannel.name)) {
            addMemberToParticipants(newState.member, timestamp);
        }
    } else {
        // user switched channels 
        // don't add a user only if the old channel AND the new channel are in the listened channels 
        // used demorgans here: !(oldChannel && newChannel)
        if (!listenedVoiceChannels.includes(oldChannel.name) || !listenedVoiceChannels.includes(newChannel.name)) {
            addMemberToParticipants(newState.member, timestamp);
        }
    }
});

function handleCommand(message, command, content) {
    switch (command) {
        case SAVE_COMMAND:
            handleSave(message, content);
            break;
        case START_COMMAND:
            handleStart(message, content);
            break;
        case GET_COMMAND:
            handleGet(message);
            break;
        case ADD_COMMAND:
            handleAdd(message, content);
            break;
        default:
            handleInvalidCommand(message);
            break;
    }
}

client.on('message', message => {

    // do not respond to bots
    if (message.author.bot) return;

    const content = message.content;

    // make sure the message is in the bot-spam channel and 
    // that the bot reacts to the proper people 
    if (authorizedTextChannels.includes(message.channel.id) && (message.member.roles.cache.some(role => role.id === EBOARD_ROLE_ID) || authorizedUsers.includes(message.author.id))) {
        const tokens = content.split(' ');
        const command = tokens[0];
        handleCommand(message, command, content);
    } else {
        message.channel.send('You do not have privilege to do that.');
    }
});

client.login(token);
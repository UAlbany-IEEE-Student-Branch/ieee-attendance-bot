const Discord = require('discord.js');
const fs = require('fs');
const { token } = require('./config.json');

const client = new Discord.Client();

// a map containing participants in a meeting and their entry
// and exit timestamps
let participants = new Map();

// a list of voice channels to watch for activity 
const listenedVoiceChannels = ['Presentation', 'Project Development Voice', 'Coding Night', 'Officers Voice', 'Voice 1'];

// users that the bot listens to
let whitelistedUsers = ["346836689529995274", '274354935036903424', '553018047657541642', '171088701814865930', '572111048656683009'];

// text channels that the bot will listen to 
const whitelistedTextChannels = ["685315837015752723"];

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
            timestamps: [timestamp]
        }
        participants.set(userId, userDetail);
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

function handleSave(message, command) {

    isListening = false;
        
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

        sendAttendanceToMessageAuthor(message);
    } else {
        message.channel.send('Please retry. Make sure to include an event title when you use save.\nUsage: !save <event title>');
    }
}

function handleStart(message, command) {

    isListening = true;

    // just represents whether the command was ok or not
    let commandValid = true;

    let timestamp;
    if (command.trim().length > 6) {

        // if the user includes the starting time, use that for the timestamp
        timestamp = Date.parse(command.substring(6).trim());

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

function addWhitelistedUser(message, command) {
    const pattern = /^\d+$/;
    if (command.trim().length > 4) {
        const userId = command.substring(4).trim();
        if (pattern.test(userId)) {
            whitelistedUsers.push(userId);
            message.channel.send(`${userId} can now use the bot.`);
        } else {
            message.channel.send(`${userId} didn't pass the vibe check.`);
        }
    } else {
        message.channel.send('You need to give a user ID as a parameter.');
    }
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
    }
});

client.on('message', message => {
    const command = message.content;

    // make sure the message is in the bot-spam channel and 
    // that the bot reacts to the proper people 
    if (whitelistedTextChannels.includes(message.channel.id)) {

        if (command.includes('!save')) {
            if (whitelistedUsers.includes(message.author.id))
                handleSave(message, command);
            else 
                message.channel.send('You do not have privilege to do that.');
        }

        if (command.includes('!start')) {

            if (whitelistedUsers.includes(message.author.id)) {
                if (!isListening) {
                    handleStart(message, command);
                } else {
                    message.channel.send("Sorry, I'm already listening!");
                }     
            } else {
                message.channel.send('You do not have privilege to do that.');
            }  
        }

        if (command.includes('!get')) {
            if (whitelistedUsers.includes(message.author.id))
                handleGet(message);
            else 
                message.channel.send('You do not have privilege to do that.');
        }

        if (command.includes('!add')) {
            if (whitelistedUsers.includes(message.author.id))
                addWhitelistedUser(message, command);
            else 
                message.channel.send('You do not have privilege to do that.');
        }
    } 
});

client.login(token);
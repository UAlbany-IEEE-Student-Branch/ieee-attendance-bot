# ieee-attendance-bot
discord.js bot to keep attendance at ieee virtual meetings.

## Installation
If you're trying to use this on your local computer, just clone the repository and then run `npm install` to install the dependencies. 

## Usage
The bot only responds to E-Board members (you can whitelist users temporarily with !add).

To test, just type `node index.js`. Since this is a 24/7 bot, you won't need to worry about this. If you're testing on your local machine then you should make sure that the deployed bot is off. 

Since it's a 24/7 bot you shouldn't have to worry about starting the bot. But, if for some reason AWS goes down or something, here is how to start it: 
```pm2 start index.js```
- If you want to stop the bot: 
  - `pm2 stop <id>` (if this is the only thing running with pm2 then you'll probably use 0 for the id, so `pm2 stop 0`)
- If you want to look at logs: 
  - `pm2 logs <id>` (again, proabably will use 0 for id).

pm2 just runs the bot as a background process, so that way you still have control over the file system while the bot is running. 

When you're using the bot on the Discord server, you'll want to use `!start` before the beginning of an event and then `!save` after it's over. If you forget to use `!start` before the beginning, you can specify a starting timestamp ([see Using `!start`](#using-!start))

### Using `!save`
When you use !save to save the attendace, the bot expects you to also include a name for the event. 
- For example: `!save Monday Coding Night`. 

There's no need to include a date as the bot will figure it out. The bot will dm the attendance to the user that used `!save`. 
#### Warning
Try not to use `!save` two or more times in a row. It can make bad  things happen... say a user enters once and you use `!save`. Now the user has  two timestamps (ok, good). Then what if  that  user leaves and you use !save again? Now the attendance has incorrect timestamps. The timestamps would show that the user joined and left, and then joined and left. But in reality, the user joined, then the bot added a timestamp, then the user left, and the bot added another timestamp. 

### Using !start
Since the bot is on 24/7, just use !start to prime the bot for taking a new list of participants at an event. !start will clear the list of the previous event, check if users are already in a workshop voice channel (Presentation and Project Development Voice), and take an optional parameter that specifies the start of the meeting. If the optional parameter isn't given, then the bot assumes that the start of the meeting was when the user used `!start`. 
- Example: `!start 01 Jan 1970 23:59:59 EST`
 
This format is pretty strict, so don't stray away from it too much or else it can cause errors and inconsistencies in the attendance. The bot won't let you use !start more than once without using !save first to avoid somebody accidentally erasing the attendance. 

### Using `!get`
Simply type !get in the bot-spam channel and the bot will send the attendance to you.

### Using `!add`
By typing `!add` and the user ID of a member, you can temporarily whitelist the user until the bot logs off. Whitelisting a user means that they can use the bot's commands. 

## How to Contribute
If you'd like to contribute, please open an issue in this repository, fork this project, make a new branch on your fork, and then make a pull request. Or, ask the current Secretary for access. 

### Todo
- ~~make a start command so that anyone can tell the bot to start logging~~
- ~~have the !start/!save command clear the list of participants if this becomes a 24/7 bot~~
- ~~have the bot log everyone who is already in certain voice channels be added to the attendance in case the bots starts late~~
- ~~log time on bot login if there are users in a voice channel and bot logged in late for event~~
- ~~let the start command take an optional parameter that is a time that represents the start of the meeting in case the bot starts late~~
- ~~Use the user id instead of the nickname/username in case the user switches their username or nickname (would also need to make sure that discord js can get a user's nickname/username based on their id)~~
- ~~switch from heroku to aws, use aws to hold the attendance file and bot~~
- ~~add a command to the bot that dms the attendance to the user who queried it~~
- ~~make it so that the bot commands only work in bot spam~~
- add logs and timestamps to make it easier to investigate errors
- make a command that will show a preview of the attendance

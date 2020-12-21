# ieee-attendance-bot
discord.js bot to keep attendance at ieee virtual meetings.

## Usage
~~```node index.js```~~
~~Intended to be run on the day of an event. Simply turn the bot on before the meeting. Once the meeting is over, use the command !save to save the attendance. Then, turn off the bot.~~
Since the bot is online 24/7, there's no need to worry about turning it on unless Heroku fails.

## Using !save
When you use !save to save the attendace, the bot expects you to also include a name for the event. For example:
```!save Monday Coding Night```
There's no need to include a date as the bot will figure it out. You can use !save two or more times in a row if you accidentally called it too early. 

## Using !start
Since the bot is on 24/7, just use !start to prime the bot for taking a new list of participants at an event. !start will clear the list of the previous event. 

## How to Contribute
If you'd like to contribute, please open an issue in this repository, fork this project, make a new branch on your fork, and then make a pull request. 

### Todo
- ~~connect the bot to heroku for when it becomes a 24/7 bot~~
- ~~make a start command so that anyone can tell the bot to start logging~~
- ~~have the !start/!save command clear the list of participants if this becomes a 24/7 bot~~
- have the bot log everyone who is already in certain voice channels be added to the attendance in case the bots starts late
- log time on bot login if there are users in a voice channel and bot logged in late for event
- let the start command take an optional parameter that is a time that represents the start of the meeting in case the bot starts late
- make a command that will show a preview of the attendance
- connect the bot to a database to store the attendance so that anyone can use the bot, or find a way to merge the attendances that are on two different local computers
- find a way for a heroku-hosted bot to access the database to update the attendance
- turn on  automatic deploys for the bot on heroku
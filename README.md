# ieee-attendance-bot
discord.js bot to keep attendance at ieee virtual meetings.

## Usage
```node index.js```
Intended to be run on the day of an event. Simply turn the bot on before the meeting. Once the meeting is over, use the command !save to save the attendance. Then, turn off the bot. 

## Using !save
When you use !save to save the attendace, the bot expects you to also include a name for the event. For example:
```!save Monday Coding Night```
There's no need to include a date as the bot will figure it out. 

## How to Contribute
If you'd like to contribute, please open an issue in this repository, fork this project, make a new branch on your fork, and then make a pull request. 

### Todo
- convert to 24/7 bot
- log time on bot login if there are users in a voice channel and bot logged in late for event
- make a start command so that anyone can tell the bot to start logging
- let the start command take an optional parameter that is a time that represents the start of the meeting in case the bot starts late
- make a command that will show a preview of the attendance
- have the !save command clear the list of participants if this becomes a 24/7 bot
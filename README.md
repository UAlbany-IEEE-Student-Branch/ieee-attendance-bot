# ieee-attendance-bot
discord.js bot to keep attendance at ieee virtual meetings.

## Usage
```node index.js```
Intended to be run on the day of an event. Simply turn the bot on before the meeting. Once the meeting is over, use the command !save to save the attendance. Then, turn off the bot. 

## Using !save
When you use !save to save the attendace, the bot expects you to also include a name for the event. For example:
```!save Monday Coding Night```
There's no need to include a date as the bot will figure it out. 
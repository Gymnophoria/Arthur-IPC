# Arthur-IPC
The IPC (inter-process communication) module for Arthur. Runs an IPC server using node-ipc to allow communication between the [Arthur Bot](https://github.com/Gymnophoria/Arthur) and the [Arthur Website](https://github.com/Gymnophoria/Arthur-Website).

# Documentation

Server events are events that the server *receives* and interprets; they are *emitted* by a client. The opposite is true: client events are events that a client *receives* and interprets, emitted by the server.

## Server Events
Events that the server receives from clients. Each event has a JSON object as data, with keys defined below.
#### hello
Allows server to cache socket and start any repetitive data polls (intervals) (e.g. sending cached stats to website)
 - `id`, string: The id of the client connecting, should be either `website` or `bot`.
 - `intervals`, array\<string>: Types of data to be sent on an interval. Sends all data associated with type, regardless of ID, so.. be careful.
 
#### data
Sent with data to be cached, likely sent on an interval.
 - `type`, **string**: The type of the data. One of the data types defined in a section below.
 - `data`, **object**: The data to be cached.
 - `time`, **number**: The time, in seconds, for the data to be kept in the cache. A value less than 0 means that the data should not be cached, and no value or 0 means that the data should be cached forever.

#### get
An event that requests data from the cache or the requested resource.
 - `from`, **string**: Where to get the data from; `bot` or `website`.
 - `type`, **string**: The data type. Types defined below.
 - `request`, **number**: The request number, provided by the client so it can differentiate `get` requests.
 - `id`, **string** *(optional)*: The ID for the type of data requested. May be necessary to get data (e.g. guild ID).
 - `fresh`, **boolean** *(optional)*: Whether or not to get fresh data; that is, data that is not cached by the server.
 
#### post
An event that posts data to a client.
 - `to`, **string**: Where to post the data to; `bot` or `website`.
 - `request`, **number**: The request number.
 - `type`, **string**: The data type, must be one in the "actions" section below.
 - `action`, **string**: The action to be done on the data type; see "actions" below.
 - `id`, **string**: The ID of the data type to be updated.
 - `params`, **object**: Any extra required parameters, such as IDs or updated information.
 
#### response
A response (to a `get` event, client-side) from a client with data.
 - `request`, **number**: The request number that the server provided with the get request.
 - `data`, **object**: The data requested.
 - `time`, **number**: Same as in `data`; time for data to be cached, in seconds.  
    **OR**
 - `request`, **number**: The request number that the server provided with the get request.
 - `error`, **string**|`true`: The error the client encountered while attempting to get the data.

#### postResponse
A response to a `post` event, simply indicating whether or not the request succeeded.
 - `request`, **number**: The request number.
 - ?`error`, **string**|`true`: The error the server or client encountered while sending the post request. If this property is omitted, the request completed successfully.


## Client Events
### Bot only
#### get
Data request from the server (originating from another client).
 - `type`, **string**: The data type
 - `request`, **number**: The request number, as provided by the server, to differentiate requests.
 - `id`, **string** *(optional)*: The ID of the data being requested (e.g. guild ID).
 
#### post
Data update event from the server, originating from another client.
 - `request`, **number**: The request number.
 - `type`, **string**: The data type, must be one in the "actions" section below.
 - `action`, **string**: The action to be done on the data type; see "actions" below.
 - `id`, **string**: The ID of the data type to be updated.
 - `params`, **object**: Any extra required parameters, such as IDs or updated information.
 
 Bot responds with a `postResponse` event.

### Website only
#### data
Data received from server on an interval (with intervals defined in the `hello` event).
 - `type`, **string**: The data type. Types defined below.
 - `data`, **object**: The data received.
 - `time`, **number**: The time for the data to be cached, in seconds
 
#### response
Data returned in response to a `get` event.
 - `request`, **number**: The request number that was provided to differentiate requests.
 - `data`, **object**: The response data.  
    **OR**
 - `request`, **number**: The request number that was provided to differentiate requests.
 - `error`, **string**|`true`: The error the server or client encountered while attempting to get the data.
 
#### postResponse
A response to a `post` event, simply indicating whether or not the request succeeded.
 - `request`, **number**: The request number.
 - ?`error`, **string**|`true`: The error the server or client encountered while sending the post request. If this property is omitted, the request completed successfully.

---

Bot only and website only client events are exclusive only because they are only useful in that context. However, every client event can be implemented in any client if needed.
 
 
## Data Types
#### guild
A modified [discord.js Guild object](https://discord.js.org/#/docs/main/stable/class/Guild), where `id` refers to the guild's snowflake ID, with the following properties:
 - `channels`: An **array** of the guild's channels, in the form of the `channel` data type
 - `iconURL`: The icon URL of the guild
 - `name`: The name of the guild
 - `id`: The guild ID
 - `options`: The guild's options from Arthur's database (including levels, prefix, npNotify, locale, levelMessage, humongoji, and possibly more).
 - `userBlacklist`: The guild's blacklisted user IDs from Arthur's database, in an array.
 
#### music
A guild's partial music object, where `id` refers to the guild ID.
 - `playing`: Whether or not music is playing (paused or not).
 - `textChannel`: The text channel the music is putting notifications in, in the `channel` data type.
 - `queue`: An **array** with the guild's queue, where each object contains:
   - `type`: The type of song requested; see the comments in the `exports.run` of [Arthur:commands/music/play.js](https://github.com/Gymnophoria/Arthur/blob/master/commands/music/play.js).
   - `id`: The ID of the song; may be a URL or an ID, depending on the song type.
   - `meta`: Metadata information for the song, in the following format:
     - `title`: Title of the song.
     - `url`: URL to the song.
   - `person`: A **user** object (without database properties) showing who played the song.
 - `voteSkips`: An **array** of user IDs of users who have voted to skip.
 
#### stats
A stats object with statistics about Arthur, has no `id`.


#### locale
A locale file in its entirety, where `id` refers to the locale code. For an example locale file structure, see [Arthur's en-US locale](https://github.com/Gymnophoria/Arthur/blob/master/locales/en-US%20English%2C%20US.json)

#### commands
All of Arthur's commands and their configurations, has no `id`.
 - `name`: The command's name
 - `enabled`: Whether or not the command is enabled.
 - `permLevel`: Arthur's permission level for the command.
 - `category`: The category that the command is in, lowercased (use locale file to get capitalized version).
 - ?`perms`: Bot permissions required to run the command.
 - ?`userPerms`: User permissions required to run the command.
 - ?`cooldown`: The time, in ms, that a user must wait before reusing the command.
 - ?`guildCooldown`: The time, in ms, that any user in a given guild must wait before reusing the command.
 
#### user
A modified [discord.js User object](https://discord.js.org/#/docs/main/stable/class/User), where `id` refers to the user's snowflake ID, with the following properties:
 - `displayAvatarURL`: The avatar URL of the user.
 - `id`: The snowflake ID of the user.
 - `username`: The username of the user.
 - `disctriminator`: The Discord discriminator of the user.
 - `options`: The Arthur options for the user. Currently just stores `locale`.
 - ?`xp`: All of the user's XP rows in Arthur's database.
 
#### guildXP
All of a guild's XP rows, in an **array**, where `id` refers to the guild's snowflake ID.

---

A * denotes that the datatype cannot be requested with a `get` event, but is rather part of other datatypes.  
A ? denotes that the property may not be present.

## Actions
Actions used in a post event. Sorted by data type; the headers (e.g. `guild`) are the `type` in the post event. The subheadings (e.g. `updateOptions`) are the `action` in the post event. Bulleted lists are the `params` to be sent.
### guild
`id` refers to the guild's snowflake ID.
#### updateOptions
Update a guild's options. All included params are updated.
 - Any of `levels`, `prefix`, `npNotify`, `locale`, `levelMessage`, `humongoji`: That field's updated value.

#### blacklistUser
Add a blacklisted user.
 - `userID`, **string**: The user ID to be blacklisted.

#### unblacklistUser
Remove a blacklisted user.
 - `userID`, **string**: The user ID to remove from the blacklist.


### music
`id` refers to the guild ID.
**ALL** actions with music data type should have a `userID` in the params; this is the user who did the action.
#### togglePausePlay
Toggles playing status of the music.

#### addToQueue
Adds a song to the queue.
 - `song`, **string**: The song to be added, interpreted by the `parseMessage` function of Arthur's [struct/music.js](https://github.com/Gymnophoria/Arthur/blob/master/struct/music.js).

#### stop
Stop all music.

#### skip
Skip the current song.

#### likeToggle
Toggle the user's liked status of the song.

#### loop
Toggle whether or not music is looping.

#### remove
Remove a song from the queue.
 - `number`, **number**: The number in the queue of the song to remove.

#### shuffle
Shuffle the queue.

#### move
Move a song in queue.
 - `number`, **number**: The number of the song to move.
 - `position`, **number**: The position to move the song to.


### user
`id` refers to the user ID. 
#### updateOptions
Update the user's options. All included parameters are updated.
 - `locale`, **string**: The locale code to switch to. 
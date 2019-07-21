const ipc = require('node-ipc');

ipc.config.id = 'ipcServer';
ipc.config.retry = 1500;
ipc.config.maxConnections = 2;

/* Types *
 * guild: A partial discord guild object, with relevant info
 * music: A guild's music object
 * stats: A stats object (yet to be defined) with system stats, command stats, music stats, and more
 * locale: A locale file in its entirety
 * commands: Client commands' `command.options` object, such that cooldowns, category, etc. can be viewed
 *           on website.
 * userInfo: A user's preferences, such as locale, as well as their XP info
 * guildXP: A guild's XP info
 * 
 * 
 * Server Events *
 * hello: object with { id: 'bot' | 'website' }, allows server to cache socket and start any repetitive data
 *        polls (intervals) (e.g. sending cache data to website)
 *        
 * data: Sent with data for cache to update with. { type: 'guild|music|stats|etc.', data: { ... }, time: 43 }
 *              `time` is the time, in seconds, for the data to be cached locally
 * 
 * get: { from: 'bot|website', type: 'guild|music|stats|locale', id: '392394923', request: 3 }
 *      Gets requested data either from cache or from requested resource
 *      `request` is a request ID from requester
 *      `id` is optional but may be necessary for datatype; e.g. guild ID or locale code
 *              Responds with a `response` event emited
 *      
 * response: Response from bot or website with data. { request: 4, data: { ... } }
 *           `request` is a request ID given from the server
 *           
 * musicUpdate: From website to bot only, changes bot music in some way. Updates cache and sends same event to bot.
 *              `type`: one of the music types (togglePausePlay, addToQueue, stop, skip, likeToggle, loop, remove, shuffle, move)
 *              `guild`: the ID of the guild where music is being played
 *              `user`: the user ID of the person doing the action
 *           
 *           
 * Client Events *
 * data: { type: 'same', data: { ... }, time: 39 } - Data given from a interval, for example
 * 
 * get: { type: 'same', id: 'same', request: 93 } - Get data for server.
 *             Responds with a `respond` event.
 *      
 * response { request: 7, data: { ... } } - Response data from a `get` event.
 * 
 * 
 * Bot Only *
 * musicUpdate: responds to musicUpdate event from server, documented in client events section
 */

let reqCounter = 0;
let sockets = {};

ipc.serve(() => {
	const { server } = ipc;
	
	server.on('hello', (data, socket) => {
		let { id } = data;
		sockets[id] = { socket };
	});
});

ipc.server.start();
const ipc = require('node-ipc');

const Cache = require('./structures/Cache');
const Queue = require('./structures/Queue');

ipc.config.id = 'ipcServer';
ipc.config.retry = 1500;
ipc.config.maxConnections = 2;

/* Types *
 * guild: A partial discord guild object, with relevant info
 * music: A guild's music object
 * stats*: A stats object (yet to be defined) with system stats, command stats, music stats, and more
 * locale: A locale file in its entirety
 * commands*: Client commands' `command.options` object, such that cooldowns, category, etc. can be viewed
 *           on website.
 * userInfo: A user's preferences, such as locale, as well as their XP info
 * guildXP: A guild's XP info
 * a * indicates that the type does not have a id, and will thus use '0' as the id.
 * 
 * Server Events *
 * hello: object with { id: 'bot' | 'website' , intervals: [] }, allows server to cache socket and start any 
 *        repetitive data polls (intervals) (e.g. sending cache data to website)
 *        `intervals` is an array with all types of data to be sent on an interval. Sends all
 *              data associated with type, so like, gotta be careful.
 *        
 * data: Sent with data for cache to update with. { type: 'guild|music|stats|etc.', data: { ... }, time: 43, id: '34 }
 *              `time` is the time, in seconds, for the data to be cached locally, less than 0 means shouldn't be
 *                      cached, 0 or no time means cache forever.
 * 
 * get: { from: 'bot|website', type: 'guild|music|stats|locale', id: '392394923', request: 3 }
 *      Gets requested data either from cache or from requested resource
 *      `request` is a request ID from requester
 *      `id` is optional but may be necessary for datatype; e.g. guild ID or locale code
 *              Responds with a `response` event emited
 *      
 * response: Response from bot or website with data. { request: 4, data: { ... }, time: 3 }
 *           `request` is a request ID given from the server,
 *           `time` is same as above
 *           
 * musicUpdate: From website to bot only, changes bot music in some way. Updates cache and sends same event to bot.
 *              `type`: one of the music types (togglePausePlay, addToQueue, stop, skip, likeToggle, loop, remove, shuffle, move)
 *              `guild`: the ID of the guild where music is being played
 *              `user`: the user ID of the person doing the action
 *           
 *           
 * Client Events *
 * data: { type: 'same', data: { ... }, time: 39, id: '23' } - Data given from a interval, for example
 * 
 * get: { type: 'same', id: 'same', request: 93 } - Get data for server.
 *             Responds with a `respond` event.
 *      
 * response { request: 7, data: { ... } } OR { request: 4, error: true } - Response data from a `get` event.
 * 
 * 
 * Bot Only *
 * musicUpdate: responds to musicUpdate event from server, documented in client events section
 */

let cache = new Cache();
let queue = new Queue();
let sockets = {};
let server;

ipc.serve(() => {
	server = ipc.server;
	
	server.on('hello', (data, socket) => { // TODO: Interval support here, e.g. sending stats to website on interval. Perhaps what to send over on an interval should be sent with hello event data?
		let { id, intervals = [] } = data;
		
		if (intervals.length > 0) socket.intervals = [];
		intervals.forEach(type => {
			let interval = setInterval(() => {
				let data = cache.getAll(type);
				data.forEach((val, key) => {
					server.emit(socket, 'data', {
						type,
						id: key,
						data: val,
						time: 2
					});
				});
			}, 1000);
			
			socket.intervals.push(interval);
		});
		
		sockets[id] = socket;
		
		socket.on('close', () => {
			if (socket.intervals) socket.intervals.forEach(interval => {
				clearInterval(interval);
			});
			
			delete sockets[id];
		});
	});
	
	server.on('data', (data) => {
		let { type, id, time } = data;
		
		cache.updateCache(type, id, data.data, time);
	});
	
	server.on('get', (data, socket) => {
		let { from } = data;
		
		if (!sockets[from]) waitForReconnect(data, socket);
		else getData(data, socket);
	});
	
	server.on('response', (data) => {
		let { request, socket, type, id } = queue.get(data.request);
		
		if (data.error) return sendError(socket, request, data.error);
		
		if (data.time >= 0) cache.updateCache(type, id, data.data, data.time);
		
		if (!socket.destroyed) server.emit(socket, 'response', { request, data: data.data });
	});
});

function getData(data, socket) {
	let { from, type, id, request } = data;
	
	let cached = cache.get(type, id);
	if (cached) {
		if (!socket.destroyed) server.emit(socket, 'response', { request, data: cached });
		return;
	}
	
	let returnData = {
		request: request,
		socket: socket
	};
	
	let serverRequest = queue.add(returnData);
	server.emit(sockets[from], 'get', { type, id, request: serverRequest });
}

function waitForReconnect(data, socket, i = 0) {
	if (sockets[data.from]) return getData(data, socket);
	if (i > 10) return sendError(socket, data.request, `Could not connect to ${data.from}.`);
	
	setTimeout(() => {
		waitForReconnect(data, socket, ++i);
	}, 500);
}

function sendError(socket, request, message) {
	server.emit(socket, 'response', { request, error: message ? message : true });
}

ipc.server.start();
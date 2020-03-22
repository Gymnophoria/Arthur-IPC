const ipc = require('node-ipc');

const Cache = require('./structures/Cache');
const Queue = require('./structures/Queue');

ipc.config.id = 'ipcServer';
ipc.config.retry = 1500;
ipc.config.maxConnections = 2;

let cache = new Cache();
let queue = new Queue();
let sockets = {};
let server;

ipc.serve(() => {
	server = ipc.server;
	
	server.on('hello', (data, socket) => {
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
		cache.updateCache(data.type, data.id, data.data, data.time);
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
	let { from, type, id, request, fresh } = data;
	
	if (!fresh && cache.has(type, id)) {
		let cached = cache.get(type, id);
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
		waitForReconnect(data, socket, i + 1);
	}, 500);
}

function sendError(socket, request, message) {
	server.emit(socket, 'response', { request, error: message ? message : true });
}

ipc.server.start();
const ipc = require('node-ipc');

ipc.config.id = 'ipcServer';
ipc.config.retry = 1500;
ipc.config.maxConnections = 2;

/* Events *
 * hello: object with { id: 'bot' | 'website' }, simply allows server to cache socket
 * 
 */

let reqCounter = 0;
let sockets = {};

ipc.serve(() => {
	const { server } = ipc;
	
	server.on('hello', (data, socket) => {
		let { id } = data;
		sockets[id] = socket;
	});
});

ipc.server.start();
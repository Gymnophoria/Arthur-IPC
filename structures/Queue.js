class Queue {
	constructor() {
		this._queue = new Map();
		this._requestCount = 0;
	}
	
	add(data) {
		let id = ++this._requestCount;
		
		this._queue.set(id, data);
		return id;
	}
	
	get(id) {
		let data = this._queue.get(id);
		this._queue.delete(id);
		return data;
	}
}

module.exports = Queue;
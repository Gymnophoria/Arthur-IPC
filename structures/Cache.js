class Cache {
	constructor() {
		this._cache = {};
		this._timeouts = {};
		
		setInterval(this._purgeCache, 1000)
	}
	
	updateCache(type, id, data, time) {
		if (time < 0) return;
		
		if (!this._cache[type]) this._cache[type] = new Map();
		if (time) this._addTimeout(type, id, time);
		
		this._cache[type].set(id, data);
	}
	
	get(type, id) {
		if (!this._cache[type] || this._cache[type].has(id)) return undefined;
		
		return this._cache[type].get(id);
	}
	
	getAll(type) {
		return this._cache[type];
	}
	
	_addTimeout(type, id, time) {
		if (!this._timeouts[type]) this._timeouts[type] = new Map();
		this._timeouts[type].set(id, Date.now() + time * 1000);
	}

	_purgeCache() {
		if (!this._timeouts) return;
		let keys = Object.keys(this._timeouts);
		
		Object.values(this._timeouts).forEach((timeouts, i) => {
			timeouts.forEach((time, id) => {
				if (Date.now() - time < 0) return;
				
				let type = keys[i];
				this._cache[type].delete(id);
				this._timeouts[type].delete(id);
			});
		});
	}
}

module.exports = Cache;
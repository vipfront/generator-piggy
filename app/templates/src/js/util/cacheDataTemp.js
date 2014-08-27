/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-16
 * Time: 上午10:39
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module){

	var _private = {};
	_private.sn = 'gamecenter_';

	_private.getName = function (name, type) {
		return _private.sn + '/' + name.replace(/\//g, '//') + (type ? '/' + type.replace(/\//g, '//') : '');
	};

	_private.getLocalStorage = function(name) {
		try {
			var value = window.localStorage.getItem(_private.getName(name));
			var info = JSON.parse(window.localStorage.getItem(_private.getName(name, 'info')));
			//store.log('store.cacheData getLocalStorage: value[' + value + '] name[' + name + '] time[' + (info && info.time) + '] count[' + (info && info.count) + ']');
			window.localStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time:  ( info  && parseInt(info.time)) || new Date().getTime(),
				count: ((info  && parseInt(info.count)) || 0) + 1
			}));
			return JSON.parse(value);
		} catch(e) {
			return null;
		}
	};

	_private.setLocalStorage = function(name, value) {
		var json = JSON.stringify(value);
		//store.log('store.cacheData setLocalStorage: value[' + json + '] name[' + name + ']');
		try {
			window.localStorage.setItem(_private.getName(name), json);
			window.localStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time: new Date().getTime(),
				count: 0
			}));
		} catch (e) {
			return false;
		}
		return true;
	};

	_private.getLocalStorageTime = function(name) {
		try {
			var info = JSON.parse(window.localStorage.getItem(_private.getName(name, 'info')));
			return (info && parseInt(info.time)) || 0;
		} catch (e) {
			return 0;
		}
	};

	_private.getLocalStorageCount = function(name) {
		try {
			var info = JSON.parse(window.localStorage.getItem(_private.getName(name, 'info')));
			return (info && parseInt(info.count)) || 0;
		} catch (e) {
			return 0;
		}
	};

	_private.setLocalStorageInfo = function(name, time, count) {
		if (_private.getLocalStorageTime.call(this, name) === 0) {
			return false;
		}
		try {
			window.localStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time: new Date(time).getTime() || 0,
				count: parseInt(count) || 0
			}));
		} catch (e) {
			return false;
		}
		return true;
	};

	_private.getSessionStorage = function(name) {
		try {
			var value = window.sessionStorage.getItem(_private.getName(name));
			var info = JSON.parse(window.sessionStorage.getItem(_private.getName(name, 'info')));
			//store.log('store.cacheData getSessionStorage: value[' + value + '] name[' + name + '] time[' + (info && info.time) + '] count[' + (info && info.count) + ']');
			window.sessionStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time:  ( info  && parseInt(info.time)) || new Date().getTime(),
				count: ((info  && parseInt(info.count)) || 0) + 1
			}));
			return JSON.parse(value);
		} catch(e) {
			return null;
		}
	};

	_private.setSessionStorage = function(name, value) {
		var json = JSON.stringify(value);
		//store.log('store.cacheData setSessionStorage: value[' + json + '] name[' + name + ']');
		try {
			window.sessionStorage.setItem(_private.getName(name), json);
			window.sessionStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time: new Date().getTime(),
				count: 0
			}));
		} catch (e) {
			return false;
		}
		return true;
	};

	_private.getSessionStorageTime = function(name) {
		try {
			var info = JSON.parse(window.sessionStorage.getItem(_private.getName(name, 'info')));
			return (info && parseInt(info.time)) || 0;
		} catch (e) {
			return 0;
		}
	};

	_private.getSessionStorageCount = function(name) {
		try {
			var info = JSON.parse(window.sessionStorage.getItem(_private.getName(name, 'info')));
			return (info && parseInt(info.count)) || 0;
		} catch (e) {
			return 0;
		}
	};

	_private.setSessionStorageInfo = function(name, time, count) {
		if (_private.getSessionStorageTime.call(this, name) === 0) {
			return false;
		}
		try {
			window.sessionStorage.setItem(_private.getName(name, 'info'), JSON.stringify({
				time: new Date(time).getTime() || 0,
				count: parseInt(count) || 0
			}));
		} catch (e) {
			return false;
		}
		return true;
	};

	_private.memoryCache = {};

	_private.getMemory = function(name) {
		var data = _private.memoryCache[_private.getName(name)];
		var value = data && data.value;
		var time = data && data.time;
		var count = data && data.count;
		//store.log('store.cacheData getMemory: value[' + value + '] name[' + name + '] time[' + time + '] count[' + count + ']');
		if (typeof(data) === 'undefined') {
			return null;
		} else {
			if (data !== null) {
				data.count = (parseInt(data.count) || 0) + 1;
			}
			return value;
		}
	};

	_private.setMemory = function(name, value) {
		//store.log('store.cacheData setMemory: value[' + JSON.stringify(value) + '] name[' + name + ']');
		_private.memoryCache[_private.getName(name)] = {
			value: value,
			time: new Date().getTime(),
			count: 0
		};
		return true;
	};

	_private.getMemoryTime = function(name) {
		var data = _private.memoryCache[_private.getName(name)];
		return (data && parseInt(data.time)) || 0;
	};

	_private.getMemoryCount = function(name) {
		var data = _private.memoryCache[_private.getName(name)];
		return (data && parseInt(data.count)) || 0;
	};

	_private.setMemoryInfo = function(name, time, count) {
		if (!_private.memoryCache[_private.getName(name)]) {
			return false;
		}
		_private.memoryCache[_private.getName(name)].time = new Date(time).getTime() || 0;
		_private.memoryCache[_private.getName(name)].count = parseInt(count) || 0;
		return true;
	};

	exports.getCacheMode = function(mode) {
		switch (mode === false ? 'memory' : mode) {
			case 'memory':
				return 'memory';
			case 'sessionStorage':
				if (window.sessionStorage) {
					return 'sessionStorage';
				} else {
					return 'memory';
				}
			default:
				if (window.localStorage) {
					return 'localStorage';
				} else {
					return 'memory';
				}
		}
	};

	exports.get = function(name, mode) {
		switch (this.getCacheMode(mode)) {
			case 'localStorage':
				return _private.getLocalStorage.call(this, name);
			case 'sessionStorage':
				return _private.getSessionStorage.call(this, name);
			case 'memory':
				return _private.getMemory.call(this, name);
		}
	};

	exports.set = function(name, value, mode) {
		switch (this.getCacheMode(mode)) {
			case 'localStorage':
				return _private.setLocalStorage.call(this, name, value);
			case 'sessionStorage':
				return _private.setSessionStorage.call(this, name, value);
			case 'memory':
				return _private.setMemory.call(this, name, value);
		}
	};

	exports.isExpire = function(name, maxSecond, maxCount, mode) {
		var time = 0;
		var count = 0;
		switch (this.getCacheMode(mode)) {
			case 'localStorage':
				time = _private.getLocalStorageTime.call(this, name);
				count = _private.getLocalStorageCount.call(this, name);
				break;
			case 'sessionStorage':
				time = _private.getSessionStorageTime.call(this, name);
				count = _private.getSessionStorageCount.call(this, name);
				break;
			case 'memory':
				time = _private.getMemoryTime.call(this, name);
				count = _private.getMemoryCount.call(this, name);
				break;
		}
		if (time === 0) {
			return true;
		}
		if (Math.abs(new Date().getTime() - time) > maxSecond * 1000) {
			//store.log('store.dataCache isExpire: true name[' + name + '] maxSecond[' + maxSecond + '] time[' + time + '] now[' + new Date().getTime() + ']');
			return true;
		}
		if (count > maxCount) {
			//store.log('store.dataCache isExpire: true name[' + name + '] maxCount[' + maxCount + '] count[' + count + ']');
			return true
		}
		//store.log('store.dataCache isExpire: false name[' + name + '] maxSecond[' + maxSecond + '] maxCount[' + maxCount + '] time[' + time + '] now[' + new Date().getTime() + '] count[' + count + ']');
		return false;
	};

	exports.setInfo = function(name, time, count, mode) {
		switch (this.getCacheMode(mode)) {
			case 'localStorage':
				return _private.setLocalStorageInfo.call(this, name, time, count);
			case 'sessionStorage':
				return _private.setSessionStorageInfo.call(this, name, time, count);
			case 'memory':
				return _private.setMemoryInfo.call(this, name, time, count);
		}
	};

	/**
	 * 获取列表结构数据
	 * @param {string} params params
	 * @param {string} key key
	 * @param {string} category 分类
	 * @param {function} request 数据请求回调
	 * @param {function} callback 获取到时回调
	 * @param {boolean|number|function} expire 是否强制过期|过期时间|过期更新后回调，false：不过期，true：过期
	 * @param {boolean|number|function} update 是否强制更新|更新时间|更新后回调，默认过期会启动远程更新
	 * @param {boolean} mode 缓存模式，false时代表强制用内存存储
	 * @example
	 * request的编写规范：function(key, callback, isUpdate) {
	 *     if (isUpdate && Math.random() < 0.5) {
	 *         // isUpdate代表更新类请求，失败了问题不大
	 *         callback({result: 1, message: 'random error'});
	 *     } else {
	 *         if (typeof(key) === 'string') {
	 *             // 获取完整list
	 *             var list = [1, 2, 3, 4, 5];
	 *             var data = {};
	 *             for (var i = 0. iMax = key.length; i < iMax; i ++) {
	 *                 data[key[i]] = {id: key[i], name: key[i] + ' name'};
	 *             }
	 *             // result != 0 代表失败，message代表失败原因，数据都放在data里面，data.list必须要安装的列表，data.index可选
	 *             callback({result: 0, data: {list: list, index: data}});
	 *         } else {
	 *             // 批量获取item
	 *             var data = {};
	 *             for (var i = 0. iMax = key.length; i < iMax; i ++) {
	 *                 data[key[i]] = {id: key[i], name: key[i] + ' name'};
	 *             }
	 *             // result != 0 代表失败，message代表失败原因，数据都放在data里面
	 *             callback({result: 0, data: data});
	 *         }
	 *     }
	 * }
	 * @example 数据类型
	 * 获取列表数据:
	 * getWithListStruct(params, '0to1', category, request, function(json) {
	 *     if (json && json.result == 0) {
	 *         alert([
	 *             'totalCount: ' + json.count, // 列表总大小
	 *             'getCount: ' + json.data.length // 实际获取的大小
	 *         ].join('\r\n'));
	 *     } else {
	 *         alert([
	 *             'result: ' + json.result,
	 *             'message: ' + json.message
	 *         ].join('\r\n'));
	 *     ]
	 * });
	 *
	 * 批量获取item数据:
	 * getWithListStruct(params, [1, 2], category, request, function(json) {
	 *     if (json && json.result == 0) {
	 *         alert([
	 *             'key1: ' + json.data[1]
	 *         ].join('\r\n'));
	 *     } else {
	 *         alert([
	 *             'result: ' + json.result,
	 *             'message: ' + json.message
	 *         ].join('\r\n'));
	 *     }
	 * });
	 * @example expire调用方式
	 * 本地优先：本地有数据则采用本地，没有则采用远程的数据，expire可以不传，或expire == false, 0, null
	 * 已测试(key='0to1', key=[1,2])
	 * getWithListStruct(params, key, category, request, callback, expire);
	 *
	 * 远程优先：强制采用远程数据
	 * 已测试(key='0to1', key=[1,2])
	 * getWithListStruct(params, key, category, request, callback, true);
	 *
	 * 先用本地，再用远程：本地有数据回调callback，再用远程数据回调expire；如果本地没数据，则回调callback
	 * 已测试( key='0to1'，key=[1,2])
	 * getWithListStruct(params, key, category, request, callback, function(json) {});
	 *
	 * 指定本地过期时间：本地有数据并且没过期，才采用本地，否则采用远程的数据
	 * 已测试( key='0to1'，key=[1,2])
	 * getWithListStruct(params, key, category, request, callback, 10);
	 *
	 * @example update调用方式
	 * 过期则更新：本地有数据且不过期则采用本地，否则采用远程的数据，update可以不传，或者update == false, 0, null
	 * getWithListStruct(params, key, category, request, callback, expire, update);
	 *
	 * 只强制更新：更新后只更新本地，不回调
	 * getWithListStruct(params, key, category, request, callback, expire, true);
	 *
	 * 强制更新并回调：当本地有数据并且没过期的情况下，更新后会回调
	 * getWithListStruct(params, key, category, request, callback, expire, function(json) {});
	 *
	 * 指定更新时间：更新后只更新本地，不回调
	 * getWithListStruct(params, key, category, request, callback, expire, 10);
	 * @example 存储方式
	 * 长久：getWithListStruct(params, key, category, request, callback, expire, update);
	 * 临时：getWithListStruct(params, key, category, request, callback, expire, update, false);
	 */
	exports.getWithListStruct = function(params, key, category, request, callback, expire, update, mode) {
		var cache = arguments.callee;
		var that = this;
		var listKey = category + '_list_' + JSON.stringify(params);
		var maxCount = 2;
		if (!cache.listData) {
			// 初始化列表缓存
			cache.listData = {};
		}
		if (typeof(key) === 'string') {
			// 1、采用limit方式
			var limit = key.split('to');
			var start = parseInt(limit[0]) || 0;
			var end = parseInt(limit[1]) || 0;
			if (start >= end || start < 0) {
				callback({
					result: -1,
					message: 'error params: start[' + limit[0] + '] end[' + limit[1] + ']'
				});
				return true;
			}
			if (expire === true || (that.isExpire(listKey, parseInt(expire) || Number.MAX_VALUE, Number.MAX_VALUE, mode) && !cache.listData[listKey])) {
				// 1.1、采用limit方式-访问远程数据
				if (update !== false) {
					request([start, end].join('to'), params, function(json) {
						if (json && json.result == 0 && json.data && json.data.list) {
							var list = json.data.list;
							var index = json.data.index;
							if (!cache.listData[listKey] || update !== true) {
								cache.listData[listKey] = list;
							}
							that.set(listKey, list, mode);
							var keyList = list.slice(start, end);
							var requestList = [];
							if (index) {
								for (var i = 0, iMax = keyList.length; i < iMax; i ++) {
									if (index.hasOwnProperty(keyList[i])) {
										that.set(category + '__' + keyList[i], index[keyList[i]], mode);
									} else {
										requestList.push(keyList[i])
									}
								}
							} else {
								requestList = keyList;
							}
							if (requestList.length > 0) {
								cache.call(that, params, requestList, category, request, function(json) {
									var data = [];
									var response = (json && json.data) || {};
									for (var i = keyList.length - 1; i >= 0; i--) {
										if (response.hasOwnProperty(keyList[i])) {
											data.unshift(response[keyList[i]]);
										} else if (index.hasOwnProperty(keyList[i])) {
											data.unshift(index[keyList[i]]);
										}
									}
									callback({result: (json && json.result), message: (json && json.message) || '', count: list.length, data: data});
								}, expire, typeof(update) === 'function' ? function() {} : update, mode);
							} else {
								var data = [];
								for (var i = keyList.length - 1; i >= 0; i--) {
									data.unshift(index[keyList[i]]);
								}
								callback({result: 0, count: list.length, data: data});
							}
						} else {
							//请求数据出错，直接透传返回码，data里面放缓存里面的数据
							cache.call(that, params, key, category, request, function(old) {
								callback({result: (json && json.result) || -1, message: (json && json.message) || 'error data', count: parseInt(old && old.count) || 0, data: (old && old.data) || []});
							}, false, false, mode);
						}
					}, update === true);
				} else {
					callback({result: -1, message: 'expire and no update'});
				}
			} else {
				// 1.2、采用limit方式-访问本地数据
				var list = (cache && cache.listData && cache.listData[listKey]) || [];
				var total = (list && list.length) || 0;
				//true强制更新、number到达更新时间、function更新数据后需要回调
				var needUpdate = update === true || typeof(update) == 'function' || (that.isExpire(listKey, parseInt(update) || Number.MAX_VALUE, (parseInt(update) || 0) > 0 ? maxCount - 1 : Number.MAX_VALUE, mode) && update !== false);
				if (total <= 0) {
					list = that.get(listKey, mode);
					total = (list && list.length) || 0;
					if (total > 0) {
						cache.listData[listKey] = list;
					}
				} else {
					// 更新读取次数
					that.get(listKey, mode);
				}
				if (total > 0) {
					if (start >= total) {
						callback({
							result: -1,
							message: 'error params: start[' + start + '] total[' + total + ']'
						});
						return true;
					}
					//从本地读到list，然后取出id列表，从缓存中读
					// 如果key是“0to1”格式的，那么request要支持“0to1”和[id,id]两种方式的key
					//但是两种key返回的数据格式不一样。
					var keyList = list.slice(start, end);
					cache.call(that, params, keyList, category, request, function(json) {
						var data = [];
						if (json && json.data) {
							for (var i = keyList.length - 1; i >= 0; i--) {
								if (json.data.hasOwnProperty(keyList[i])) {
									data.unshift(json.data[keyList[i]]);
								} else {
									//@todo 缺失时需要返回错误信息
								}
							}
						}
						callback({result: (json && json.result), message: (json && json.message) || '', count: list.length, data: data});
						//过期逻辑
						if (typeof(expire) === 'function' && update !== false) {
							cache.call(that, params, key, category, request, expire, true, update, mode);
						} else if (needUpdate) {
							cache.call(that, params, key, category, request, typeof(update) === 'function' ? update : function() {}, true, true, mode);
						}
						//因为上面有limit方式的过期逻辑，所以如果expire是function的时候，则不需要走key的过期逻辑，update也是同理。
					}, typeof(expire) === 'function' ? null : expire, needUpdate ? null : update, mode);
				} else {
					cache.call(that, params, key, category, request, callback, true, update, mode);
				}
			}
		} else {
			if (!(key.length > 0)) {
				callback({
					result: -1,
					message: 'error '
				});
				return true;
			}
			if (expire === true) {
				// 2.1、采用id方式-获取远程数据
				if (update !== false) {
					request(key, params, function(json) {
						if (json && json.result == 0 && json.data) {
							var data = {};
							for (var i = 0, iMax = key.length; i < iMax; i ++) {
								if (json.data.hasOwnProperty(key[i])) {
									that.set(category + '__' + key[i], data[key[i]] = json.data[key[i]], mode);
								}
							}
							callback({result: 0, data: data});
						} else {
							cache.call(that, params, key, category, request, function(old) {
								callback({result: json && json.result, message: json && json.message, data: old && old.data});
							}, false, false, mode);
						}
					}, update === true);
				} else {
					callback({result: -1, message: 'expire and no update'});
				}
			} else {
				// 2.2、采用id方式-获取本地数据
				var data = {}, requestList = [], checkList = [];
				for (var i = 0, iMax = key.length; i < iMax; i ++) {
					if (that.isExpire(category + '__' + key[i], parseInt(expire) || Number.MAX_VALUE, Number.MAX_VALUE, mode)) {
						requestList.push(key[i]);
					} else {
						data[key[i]] = that.get(category + '__' + key[i], mode);
						if (update === true || typeof(update) === 'function' || (that.isExpire(category + '__' + key[i], parseInt(update) || Number.MAX_VALUE, (parseInt(update) || 0) > 0 ? maxCount : Number.MAX_VALUE, mode) && update !== false) || (typeof(expire) === 'function' && update !== false)) {
							checkList.push(key[i]);
						}
					}
				}
				if (requestList.length > 0) {
					cache.call(that, params, requestList.concat(checkList), category, request, function(json) {
						if (json && json.data) {
							for (var i = 0, iMax = requestList.length; i < iMax; i ++) {
								if (json.data.hasOwnProperty(requestList[i])) {
									data[requestList[i]] = json.data[requestList[i]];
								}
							}
							callback({result: (json && json.result), message: (json && json.message) || '', data: data});
						} else {
							callback({
								result: (json && json.result) || -1,
								message: (json && json.message) || 'error data'
							});
						}
					}, true, update, mode);
				} else {
					callback({result: 0, data: data});
					if (checkList.length > 0) {
						if (typeof(expire) === 'function') {
							//本地数据过期，回调expire
							cache.call(that, params, checkList, category, request, expire, true, update, mode);
						} else {
							//当本地有数据并且没过期的情况下，更新后会回调update
							cache.call(that, params, checkList, category, request, typeof(update) === 'function' ? update : function() {}, true, true, mode);
						}
					}
				}
			}
		}
		return that.get(listKey);
	};
});
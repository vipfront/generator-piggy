/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-15
 * Time: 下午3:12
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module){
	var _private = {};

	_private.lockCount = {};
	_private.callback = {};
	_private.process = {};

	exports.lockNext = function(key, category, callback, process, context) {
		var signal = 'next&' + escape(category || 'default') + '&' + escape(key);
		if (_private.lockCount[signal]) {
			_private.callback[signal].push(callback);
			_private.lockCount[signal] ++;
		} else {
			_private.lockCount[signal] = 1;
			_private.callback[signal] = [callback];
			process.call(context || null, function() {
				var callback = null;
				while (callback = _private.callback[signal].shift()) {
					callback.apply(context || null, Array.prototype.slice.call(arguments, 0));
				}
				_private.lockCount[signal] = 0;
			});
		}
	};

	_private.lockMultiple = function(lock, key, category, callback, process) {
		var signal = 'single&' + escape(category || 'default') + '&' + escape(key);
		if (lock) {
			if (_private.lockCount[signal]) {
				_private.lockCount[signal] ++;
				_private.callback[signal].push(callback);
				_private.process[signal].push(process);
			} else {
				_private.lockCount[signal] = 1;
				_private.callback[signal] = [callback];
				_private.process[signal] = [process];
			}
		}
		if (!lock || _private.lockCount[signal] <= 1) {
			var process = _private.process[signal].shift();
			if (typeof(process) === 'function') {
				process.call(null, function( json ) {
					_private.lockCount[signal] --;
					var callback = _private.callback[signal].shift();
					if (typeof(callback) === 'function') {
						//alert("update7 "+JSON.stringify(json));
						//alert("update8 "+JSON.stringify(Array.prototype.slice.call(arguments, 0)));
						//alert( key+ ":" + callback)		
						callback.apply(null, Array.prototype.slice.call(arguments, 0));
					}
					_private.lockMultiple(false, key, category);
				})
			}
		}
	};

	exports.lockMultiple = function(key, category, callback, process) {
		_private.lockMultiple.call(this, true, key, category, callback, process);
	};

	exports.lockResult = function(callback, process) {
		var resultList = [];
		var total = null;
		total = process(function() {
			resultList.push(Array.prototype.slice.call(arguments, 0));
			if (total !== null  && resultList.length >= total) {
				total = null;
				callback.apply(null, resultList);
			}
		});
		if (total !== null  && resultList.length >= total) {
			total = null;
			callback.apply(null, resultList);
		}
	};
});
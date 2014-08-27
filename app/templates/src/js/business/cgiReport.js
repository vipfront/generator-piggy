/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 14-4-2
 * Time: 下午8:27
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {
	var _public = module.exports,
		_private = {},
		$ = require('lib/zepto'),
		net = require('util/net'),
		uri = require('util/uri');

	_private.config = {
		rate: 1
	};

	_public.getPluginHandlers = function(settings) {
		var that = this;
		var params = settings;
		if ($.type(params) === 'string') {
			params = {
				filter: params
			};
		} else if ($.isArray(params)) {
			params = {
				filter: params[0],
				code: params[1] || 0
			};
		} else {
			params = params || {};
		}
		var startTime = startTime = new Date().getTime();
		return {
			ajaxSuccess: function(event, xhr, options, data) {
				var type = 1, code = 0, time = new Date().getTime() - startTime;
				if (params.code) {
					var nameList = String(params.code).split('.');
					var i = 0, iMax = nameList.length;
					while (i < iMax && data) {
						data = data[nameList[i++]];
					}
					if (i != iMax || data) {
						type = 3;
						code = data || 0;
					}
				}
				that.send($.extend(true, {}, params, {
					url: options.url,
					type: type,
					code: code,
					time: time
				}));
			},
			ajaxError: function(event, xhr, options, errorText) {
				if (errorText != 'abort') {
					var type, code, time = new Date().getTime() - startTime;
					if (errorText == 'timeout') {
						type = 2, code = 3;
					} else if (errorText == 'parsererror') {
						type = 2, code = 1;
					} else if (xhr.status >= 400 && xhr.status < 500) {
						type = 2, code = 7;
					} else if (xhr.status >= 500 && xhr.status < 600) {
						type = 2, code = 8;
					} else {
						type = 2, code = 6;
					}
					that.send($.extend(true, {}, params, {
						url: options.url,
						type: type,
						code: code,
						time: time
					}));
				}
			}
		};
	};

	_private.mergeNameList = ['cgi', 'type', 'code', 'time'];

	_private.send = function(params) {
		var cache = arguments.callee;
		var lazyTime = 2000;
		if (!cache.mapping) {
			cache.mapping = {};
		}
		if (params) {
			var key = JSON.stringify({domain: params.domain, uin: params.uin, rate: params.rate});
			if (!cache.mapping[key]) {
				cache.mapping[key] = [];
			}
			cache.mapping[key].push(params);
		} else {
			for (var key in cache.mapping) {
				if (cache.mapping.hasOwnProperty(key)) {
					if (cache.mapping[key] && cache.mapping[key].length > 0) {
						var request = $.extend({key: _private.mergeNameList.join(',')}, JSON.parse(key)), paramsList = cache.mapping[key].splice(0, 10);
						for (var i = 0, iMax = paramsList.length, params; params = paramsList[i], i < iMax; i ++) {
							for (var j = 0, jMax = _private.mergeNameList.length, name; name = _private.mergeNameList[j], j < jMax; j ++) {
								request[[i + 1, j + 1].join('_')] = params[name];
							}
						}
						net.ping('http://c.isdspeed.qq.com/code.cgi?' + $.param(request));
						break
					} else {
						delete cache.mapping[key];
					}
				}
			}
		}
		if (cache.timer) {
			clearTimeout(cache.timer);
		}
		cache.timer = setTimeout(function() {
			cache.call(this);
		}, lazyTime);
		return true;
	};

	/**
	 * 上报数据
	 * @param {Object} params 上报参数
	 * @param {string} params.url 上报的url
	 * @param {string} params.filter url查询参数过滤规则，例如：module,method，则只上报url里面的module和method字段
	 * @param {number} params.type 返回码分类：1、成功，2、失败，3、逻辑失败
	 * @param {number} params.code 返回码，type=1时，code的定义：1、数据异常，2、权限错误，3、超时，4、DNS查询失败，5、TCP连接失败，6、CGI错误、7、4xx，8、5xx，详细参考http://oz.isd.com/itil/returncode2/help/returncode.html
	 * @param {number} params.time 耗时，单位毫秒
	 * @param {number} params.rate 上报几率，例如10代表1/10
	 * @param {number} params.uin 用户号码
	 * @return {boolean}
	 */
	_public.send = function(params) {
		if (/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/.test(decodeURIComponent(params.url))) {
			if (Math.random() < 1 / (params.rate || _private.config.rate)) {
				// params.rate默认为10，只上报1/10的请求，防止其他请求被卡住
				var domain = RegExp.$4 || '';
				var path = RegExp.$5 || '';
				var search = RegExp.$6 || '';
				var filter = params.filter ? (',' + String(params.filter || '').replace(' ', '') + ',') : '';
				_private.send.call(this, {
					domain: domain,
					cgi: path + (filter ? search.replace(/([\?\&])([^\=\&\#]*)(\=[^\&\#]*)?/g, function(str, $1, $2) {
						if (filter.indexOf(',' + $2 + ',') != -1) {
							return str || '';
						} else {
							return $1 == '?' ? '?' : '';
						}
					}).replace(/^\?+$/, '').replace(/^\?&/, '?') : ''),
					type: params.type || _private.config.type || 0,
					code: params.code || _private.config.code || 0,
					time: params.time || _private.config.time || 0,
					rate: 1,
					uin: params.uin || _private.config.uin || 0
				});
			}
			return true;
		} else {
			return false;
		}
	};
});

/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-23
 * Time: 上午10:57
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {
	var _public = module.exports,
		$ = require('lib/zepto'),
		uri = require('util/uri'),
		cgiReport = require('business/cgiReport');

	_public.getPluginHandlers = function(settings) {
        settings = settings || {};
		var cgiReportHandlers = cgiReport.getPluginHandlers(['method,isUpdate', 'result']);

		return $.extend({}, cgiReportHandlers, {
			'ajaxStart': function(event, xhr, options) {
				var keyName = settings.keyName || 'key';

				// 重写open操作，将请求改成批量请求
				xhr.open = (function(open) {
					return function(type, url, async, username, password) {
						var targetUrl = String(url || '').split('?');
						var params = uri.parseQueryString(targetUrl[1] || 0) || {};
						delete params.module, delete params.method, delete params.param;
						var data = {};
						data[keyName] = $.extend(true, {param: {tt: parseInt(params.tt) || 0}}, options.data);
						url = targetUrl[0] + '?' + $.param($.extend(params, {param: JSON.stringify(data)}));
						return open.call(xhr, type, url, async, username, password);
					};
				})(xhr.open);

				// 重写send操作，重写onreadystatechange，将批量响应修改成单个响应
				xhr.send = (function(send) {
					return function(data) {
						xhr.withCredentials = true;
						xhr.onreadystatechange = (function(onreadystatechange) {
							return function() {
								if (xhr.readyState == 4 && !/^\s*$/.test(xhr.responseText)) {
									try {
										var data = $.parseJSON(xhr.responseText);
										if (!data.data || !data.data[keyName]) {
											throw {number: data.ecode, message: 'key nofound'};
										}
										if (!data.data[keyName].retBody) {
											throw {number: data.data[keyName].retCode, message: 'retBody nofound'};
										}
										xhr.responseText = JSON.stringify(data.data[keyName].retBody);
									} catch (e) {
										xhr.responseText = JSON.stringify({result:e.number || -1, message: e.message || e.name});
									}
								}
								onreadystatechange.apply(xhr, Array.prototype.slice.call(arguments, 0));
							};
						})(xhr.onreadystatechange);
						return send.call(xhr, data);
					};
				})(xhr.send);

				if (typeof(cgiReportHandlers.ajaxStart) === 'function') {
					return cgiReportHandlers.ajaxStart.apply(cgiReportHandlers, Array.prototype.slice.call(arguments, 0));
				}
			}
		});
	};
});
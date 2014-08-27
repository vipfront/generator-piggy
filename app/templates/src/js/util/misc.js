/**
 * 函数库
 */
define(function(require, exports, module){
	
	var misc = module.exports = {};
	
	/**
	 * 从queryString或者hash里获取参数值
	 * @param {String} key 参数名称
	 */
	misc.getHttpParams = function(key, str){
		str = str || location.href;
		var r = new RegExp('(\\?|#|&)'+key+'=([^&#]*)(&|#|$)');
		var m = str.match(r);
		var v = decodeURIComponent(!m?'':m[2]).replace(/\+/g,' ');
		return v;
	};
	
	
	/**
	 * 获取随机数
	 */
	misc.getRandom = function(start, end){
		return Math.floor(Math.random() * (end - start) + start);
	};
	
	/**
	 * 往url中添加参数
	 */
	misc.addParam = function(url, params){
		var connector;
		params = params || {};
		params = $.param(params);
		connector = url.indexOf('?') === -1 ? '?' : '&';
		url = url + connector + params;
		return url;
	};
});
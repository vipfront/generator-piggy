/**
 * 调试日志,会把日志打印在页面底部.
 * 只有在url中传入debug参数才会生效：debug=1
 *
 * @module console
 * User: dreamzhu
 * @date: 2014-05-28
 * Time: 17:06
 */
define(function(require, exports, module) {
	var $ 	= 	require('lib/zepto'),
	consoleContainer	=	null;

	//只有在gamecentertest.cs0309.3g.qq.com下才会打印调试信息
	var isDebug = /gamecentertest\.cs0309\.3g\.qq\.com$/i.test(location.hostname);

	/**
	 * 生成日志打印容器，直接加到body末尾。
	 *
	 * @method createConsoleContainer
	 * @private
	 */
	function createConsoleContainer(){
		if(!consoleContainer) {
			consoleContainer = $('<ul style="list-type:none;margin:4px;padding:2px; border:1px solid #ccc;background-color:#fff;word-wrap: break-word; word-break: normal;word-break:break-all;"></ul>').appendTo('body');
		}
	}

	/**
	 * 写日志信息,默认无样式。
	 *
	 * @method log
	 * @param {Object} msg 日志信息
	 * @param {String} [optional.style] 样式
	 */
	module.exports.debug =
	module.exports.info =
	module.exports.table =
	module.exports.log = function(msg,style) {		
		//如果是正式域名则不打印调试信息
		if(!isDebug) return;

		//生成容器
		createConsoleContainer();

		typeof msg == 'object' && (msg = JSON.stringify(msg));
		var item = $('<li></li>').html(msg);
		style = style || 'margin:0;';

		if(style) {

			if(typeof style == 'object') {

				style = $.extend({padding:'4px'},style);
				item.css(style);
			}
			else {

				item.attr('style','padding:4px;' + style);
			}
		}
		item.appendTo(consoleContainer);
	}

	/**
	 * 打印异常日志
	 *
	 * @method error
	 * @param {Object} msg 要打印的日志信息
	 */
	module.exports.error = function(msg) {

		this.log(msg,'background-color:#D6AFB4;')
	}

	/**
	 * 打印警告日志
	 *
	 * @method warning
	 * @param {Object} msg 要打印的日志信息
	 */
	module.exports.warn = 
	module.exports.warning = function(msg) {
		
		this.log(msg,'background-color:#E5DE9D;')
	}
});
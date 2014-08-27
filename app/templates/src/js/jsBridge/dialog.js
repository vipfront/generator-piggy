/**
 * Created with JetBrains PhpStorm.
 * User: dreamzhu
 * Date: 13-12-25
 * Time: 下午6:57
 * To change this template use File | Settings | File Templates.
 */


define(function(require, exports, module) {
	/** @module jsBridge/dialog */
	var $ = require('lib/zepto');
	var tpl = require('util/tpl');
	// 重复加载会盖掉原先的
	//require('../../css/reset.css');
	//require('../../css/gc-mod-dialog.css');
	//require('../../css/gc-icon.css');

	var _private = {};

	_private.dialogTpl = '' + 
		'<div class="gc-mod-dialog show"  id="dialogMsg">' +
			'<div class="dialog-wrapper">' +
				'<div class="dialog-body border1px-b touch-callout">' +
					'<div class="">' + 
						'<%if(title){%>' + 
						'<h3><%=title%></h3>' + 
						'<%}%>' + 
						'<p><%=content%></p>' + 
					'</div>' +
				'</div>' +
				'<div class="dialog-footer">' +
					'<% for (var i = 0; i < button.length; i++) { %>' +
					'<% if (i == select) { %>' +
					'<div class="dialog-btn select" id="dialogButton<%=i%>"><%=button[i]%></div>' +
					'<% } else { %>' +
					'<div class="dialog-btn" id="dialogButton<%=i%>"><%=button[i]%></div>' +
					'<% } %>' +
					'<% } %>' +
				'</div>' +
			'</div>' +
		'</div>';

	/**
	 * 显示提示框
	 * @param {object} params 请求参数
	 * @param {string} [params.title] 标题,默认为温馨提示
	 * @param {string} params.content 提示内容
	 * @param {array<string>|string} params.button 按钮
	 * @param {number} [params.select] 默认选中的按钮
	 * @param {function} callback 回调函数
	 * @property {object} json 回调数据
	 * @property {number} json.result 结果
	 * @property {number} json.data 用户点击的按钮
	 * @example
	 * 	dialog.show({
	 * 		title: '温馨提示',
	 * 		content: '圣诞节还在公司写代码',
	 * 		button: ['取消', '确认'],
	 * 		select: 1
	 * }, function(json) {
	 * 		alert(JSON.stringify(json));
	 * });
	 * */
	exports.show = function(params, callback) {
        callback = callback || function() {};
		if($('#dialogMsg').size() > 0){
			$('#dialogMsg').remove();
		}
		var button = [];
		if ($.isArray(params.button)) {
			button = params.button
		} else if (params.button) {
			button.push(params.button);
		} else {
			button.push('确认');
		}
		var dialog = tpl.get(_private.dialogTpl, {
			content: params.content || '',
			button: button,
			title: params.title || '',
			select: params.select || 0
		});
		$(dialog).appendTo($('body'));

		//弹框时允许页面滚动
		if(params.allowScroll){
			$.each(button, function(index, item) {
				$('#dialogButton' + index).bind('click', function(e) {
					$('#dialogMsg').remove();
					callback({result: 0, data: index});
				});
			});
		}
		else{
			//如果出现了弹窗，就允许再滚动。
			function stopScroll(){
				return false;
			}
			$('#dialogMsg').on("touchmove" , stopScroll);
			
			$.each(button, function(index, item) {
				$('#dialogButton' + index).bind('click', function(e) {
					$('#dialogMsg').remove();
					callback({result: 0, data: index});
					
					//恢复滚动
					$('#dialogMsg').off("touchmove" , stopScroll);
				
				});
			});
		}
	};
});



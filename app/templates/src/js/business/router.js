/**
 * 路由模块
 */
define(function(require, exports, module){

	var _private = {};
	var $ = require('lib/zepto');
	var uri = require('util/uri');
	var misc = require('util/misc');
	var env = require('business/environment');
	var common = require('jsBridge/common');
	var process = require('util/process');

	/**
	 * @exports business/router
	 */
	var router = module.exports = {};

	_private.params = null;
	_private.pageSrc = null;

	/**
	 * 注册ready后要执行的回调
	 * @param {function} callback 回调函数
	 * @param {string|array<string>} [module] 需要加载的模块
	 * @property {object} callback.params 页面参数，例如location.search等信息
	 * @property {object} [..module] module
	 * @example
	 * http://gamecenter.qq.com/new/deail.html?appId=3
	 * ready(function(params) {
	 *     //params.appId = 3
	 * });
	 * @example
	 * http://gamecenter.qq.com/new/deail.html?appId=3
	 * ready(function(params, common) {
	 *     //params.appId = 3
	 *     //common = jsBridge/common
	 * }, 'jsBridge/common');
	 * @example
	 * http://gamecenter.qq.com/new/deail.html?appId=3
	 * ready(function(params, common, app) {
	 *     //params.appId = 3
	 *     //common = jsBridge/common
	 *     //app = jsBridge/app
	 * }, ['jsBridge/common', 'jsBridge/app']);
	 */
	router.ready = function(callback, module) {
        var urlParams = router.getParams();
		process.lockNext('ready', 'business/router', function(data) {
			if (module) {
				require.async(module, function() {
					callback.apply(null, [$.extend(true, {}, urlParams, data)].concat(Array.prototype.slice.apply(arguments)));
				});
			} else {
				callback($.extend(true, {}, urlParams, data));
			}
		}, function(callback) {
			if (!_private.params) {
                // 如果url中有uin和sid，则不做getUserInfo调用
                var tt = common.getClient() == 'iphoneqq' ? 2 : 1;
                if(urlParams.uin && urlParams.sid) {
                    callback(_private.params = $.extend({tt: tt}, {uin: urlParams.uin, sid: urlParams.sid}));
                } else {
                    common.getUserInfo(function(json) {
                        //alert("json "+JSON.stringify(json));
                        var obj={};
                        if(json && json.data){	// 4.7会带上vkey skey
                            obj.sid=json.data.sid || urlParams.sid || '';
                            obj.uin=json.data.uin || urlParams.uin || '';
                        }
                        //alert("obj "+JSON.stringify(obj))
                        callback(_private.params = $.extend({tt: tt}, obj));
                    });
                }
			} else {
				callback(_private.params)
			}
		})
	};

	/**
	 * 页面切换，屏蔽具体实现
	 * @param {string} route 路由名称
	 * @param {object} [params] 自定义参数
	 * @params {boolean} 可选参数，标记该次是否采用新窗口打开 true表示采用新窗口,不传该参数默认为false
	 */
	router.redirect = function(route, params,ops) {
		ops=true;
		common.openUrl({
			newWindow:(typeof ops == "undefined" || ops === false) ? false : true,
			url: this.createUrl(route, params),
			target: 1,
			style: 1
		});
	};

	_private.getString = function(params) {
		return $.param(params).replace(/(?:^|&)[^\=]*\=(?:null|undefined)(?=&|#|$)/g, '');
	};
	
	/**
	 * 获取url
	 * @param {String} route 路由名称
	 * @param {object} [params] 自定义参数
	 * @return {string} url
	 * @example
	 * createUrl('http://www.qq.com/?url=true&common=0&sid={sid}', {name: true, common: 1})
	 * http://www.qq.com/?url=true&common=1&sid=AXnAVU1LfjdRGnFe--6yacBY&name=true
	 */
	router.createUrl = function(route, params) {
		var ver = (window.seajs && seajs.pageVersion) || 0;
		//加上ver版本号，以免缓存。
		var defaultParams = $.extend(true, {ver: ver }, _private.params, uri.parseQueryString(window.location.search));
		//过滤掉不合法的uin,uin必须为数字
		defaultParams.uin = defaultParams.uin*1 || 0;  
		//去掉status参数，防止客户端再次上报红点
        //去掉默认的PVSRC
		defaultParams['status'] = defaultParams['PVSRC'] = undefined;
		
		var adtag = _private.getAdtag(route, params);
		var adtagObj = {};
		
		if(adtag){
			adtagObj['ADTAG'] = adtag;
		}
		
		if (route.indexOf('://') !== -1) {
			if (/^(.+?)(\?(?:[^#]*))?(#(?:.*))?$/.test(route)) {
				var path = RegExp.$1;
				var search = RegExp.$2.replace(/\{([\d\w]+)\}/g, function(m, n) {
					if(typeof(defaultParams[n]) != 'undefined'){
						m=encodeURIComponent(defaultParams[n].toString())
					}else{
						n=n.toLowerCase();
						if(typeof(defaultParams[n]) != 'undefined'){
							m=encodeURIComponent(defaultParams[n].toString())
						}
					}
					return m;
				});
				var hash = RegExp.$3;
				
				// 查询参数优先级 自定义参数params > url参数search
				//过滤掉不合法的uin,uin必须为数字
				var urlParam = uri.parseQueryString(search);
				urlParam.uin = urlParam.uin*1 || defaultParams.uin || 0;  
				//去掉status参数，防止客户端再次上报红点
                //去掉默认的PVSRC
				urlParam['status'] = urlParam['PVSRC'] = undefined;
				return path + '?' + _private.getString($.extend(true, {},urlParam, params, adtagObj)) + hash;
			}
		} else if (route.indexOf('center/') === 0) {
			var name = route.substr('center/'.length);
			var prefix = '';
			
			if(seajs.offlinePages && !seajs.offlinePages[name]){
				prefix = 'http://gamecenter.qq.com/gamecenter/index/'
			}
		
			return prefix + name + '.html' + '?' + _private.getString($.extend(true, {}, defaultParams, params, adtagObj));
		} else {
			//var domain = 'gamecentertest.cs0309.3g.qq.com';
			var domain = 'gamecenter.qq.com';
			if (window.location.hostname.split('.').slice(-3).join('.') == '3g.qq.com') {
				domain = window.location.host;
			}
			//礼包cgi分域名到gift
			if (route.indexOf('gc_gamegift_fcgi') != -1) {
				if (window.location.host.indexOf('gamecentertest.cs0309.3g.qq.com') != -1) {
					//开发测试环境
					domain = 'gamecentertest.cs0309.3g.qq.com';
				} else if (window.location.host.indexOf('gconlytest.cs0309.3g.qq.com') != -1) {
					//专业测试环境
					domain = 'gconlytest.cs0309.3g.qq.com';
				} else if (window.location.host.indexOf('gcpre.cs0309.3g.qq.com') != -1) {
					//预发布环境
					domain = 'gcpre.cs0309.3g.qq.com';
				} else {
					//外网
					domain = 'gift.gamecenter.qq.com';
				}

			}
			//加载verCode版本号.表示成就新版。
			return 'http://' + domain + route + '?' + _private.getString($.extend(true, {}, defaultParams, params, adtagObj));
		}
		return route;
	};
	
	/**
	 * 获取用户唯一标识
	 * @return {string} 
	 */
	router.getUserId = function(sid){
		if(_private.params&&_private.params.uin){
			return _private.params.uin;
		}
		var defaultParams = $.extend(true, {}, _private.params, uri.parseQueryString(window.location.search));
		var uin = defaultParams.uin || 0;
		if (uin) {
			return uin;
		} else {
			var str = defaultParams.sid || sid || '';
			var hash = 5381;
			for(var i = 0, len = str.length; i < len; ++i){
				hash += (hash << 5) + str.charAt(i).charCodeAt();
			}
			return hash & 0x7fffffff;
		}
	};

    /**
     * 获取当前用户QQ号
     */
    router.getUin = function() {
        var defaultParams = $.extend(true, {}, _private.params, uri.parseQueryString(window.location.search));
        return defaultParams.uin;
    };

	/**
	 * 获取当前页面的输入参数
	 * @params {string} [name] 参数名称
	 * @return {object} 参数
	 * @example
	 * getParams() : {a: 0, b: {c: 1}}
	 * getParams('a') : 0
	 * getParams('b.c') : 1
	 */
	router.getParams = function(name) {
		var cache = arguments.callee;
		var params;
		if (!cache.params) {
			params = cache.params = uri.parseQueryString(window.location.search);
		} else {
			params = cache.params;
		}
		if (name) {
			var nameList = name.split('.');
			for (var i = 0, iMax = nameList.length; i < iMax; i ++) {
				if (params.hasOwnProperty(nameList[i])) {
					params = params[nameList[i]];
				} else {
					var undefined = undefined;
					return undefined;
				}
			}
		}
		return params;
	};
	
	
	
	router.setPageSrc = function(name){
		_private.pageSrc = name;
	};
	
	_private.getAdtag = function(route, params){
		var jumpSrc, jumpAdtag;
		var urlParams;
		params = params || {};
		
        // PVSRC标识模块SRC
        // _private.pageSrc标识页面SRC
		jumpSrc = params.PVSRC || _private.pageSrc;
		
		urlParams = uri.parseQueryString(window.location.search);
		
        jumpAdtag = urlParams['ADTAG'];
        if(jumpSrc) {
            if(jumpAdtag) {
                jumpAdtag = jumpAdtag.split('.')[0] + '.' + jumpSrc;
            } else {
                jumpAdtag = jumpSrc;
            }
		}
		
		return jumpAdtag;
	};
});

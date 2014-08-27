/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-14
 * Time: 下午6:25
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {
	/** @module jsBridge/common */
	var _private = {};
    var $ = require('lib/zepto');
	var net = require('util/net');
	var process = require('util/process');

    var deferreds = {};

    var deferredResult = {};
    var deferredArgs = {};

    // 以下API控制单页面仅调用一次
    // 这些API都是接受一个函数作为参数
    // GCApi.getReportPublicHighData GCApi.getReportPublicData不要加入到列表中，低版本安卓使用的是同步版本
    // 新版QQAPI下iOS接口如果有回调函数参数的话会采用异步回调
    var deferAPI = ['mqq.device.getNetworkType', 'mqq.device.getClientInfo', 'mqq.device.getDeviceInfo'];

	_private.invokeByCommonAPI = function(method, paramsList, callback, noDeferred) {
        var isDeferAPI = ~deferAPI.indexOf(method);
        var deferred;
        if(isDeferAPI) {
            deferred = deferreds[method];
            if(deferred && 'rejected' != deferred.state() && !noDeferred) {
                // 之前有调用过，并且没有失败
                deferred.done(function() {
                    callback(deferredResult[method]);
                    if('function' == typeof(paramsList[0])) {
                        paramsList[0].apply(null, deferredArgs[method]);
                    }
                }).fail(function(reason) {
                    callback(reason);
                });
                return true;
            } else {
                deferred = deferreds[method] = $.Deferred()
                deferred.done(function() {
                    callback(deferredResult[method]);
                    if('function' == typeof(paramsList[0])) {
                        paramsList[0].apply(null, deferredArgs[method]);
                    }
                }).fail(function(reason) {
                    callback(reason);
                });
            }
        }
		var nameList = method.split('.');
		var target = window;
		var iMax = nameList.length - 1;
		for (var i = 0; i < iMax; i++) {
			if (nameList[i] in target) {
				target = target[nameList[i]];
			} else {
				callback({result: 1, message: 'namespace no exist: ' + nameList[i] + ', ' + method});
                deferred && deferred.reject({result: 1, message: 'namespace no exist: ' + nameList[i] + ', ' + method});
				return false;
			}
		}
		if (typeof(target[nameList[iMax]]) !== 'function') {
			callback({result: 2, message: 'method no exist: ' + nameList[iMax] + ', ' + method});
            deferred && deferred.reject({result: 2, message: 'method no exist: ' + nameList[iMax] + ', ' + method});
			return false;
		}
		try {
            var newParamsList = paramsList;
            if(deferred) {
                newParamsList = [function(result) {
                    deferredResult[method] = {result: 0, data: result};
                    deferredArgs[method] = arguments;

                    deferred.resolve();
                }];
            }
			var result = target[nameList[iMax]].apply(target, newParamsList);
		} catch (e) {
			callback({result: 3, message: 'call error: error[' + JSON.stringify(e) + '] method[' + method + '] paramsList[' + JSON.stringify(paramsList) + ']'});
            deferred && deferred.reject({result: 3, message: 'call error: error[' + JSON.stringify(e) + '] method[' + method + '] paramsList[' + JSON.stringify(paramsList) + ']'});
			return false;
		}

        if(!deferred || mqq.android) {
            callback({result: 0, data: result});
        }
		return true;
	};

	/**
	 *是否未异步api
	 * 4.6之后把接口都从同步改为异步
	 * */
	_private.isAsyncApi = function() {
		//判断接口是否异步
		var cache = arguments.callee;
		if (typeof(cache.isAsyncApi) === 'undefined') {
			if (window.QQApi && typeof(window.QQApi.getClass) === 'function') {
				return cache.isAsyncApi = false;
			} else {
				return cache.isAsyncApi = true;
			}
		} else {
			return cache.isAsyncApi;
		}

	};
	
	exports._invokeByCommonAPI = function(method, paramsList, callback, noDeferred) {
		var cache = arguments.callee;
		var config = seajs.config();
		var base = config.data.base;
		var url = base + 'lib/qqapi.js';
		var that = this;
		_private.isAsyncApi();
		if (/[?&]_simulator=([\w]+)/.test(window.location.href)) {
			require.async('./simulator/' + RegExp.$1, function(simulator) {
				simulator._invokeByCommonAPI.call(this, method, paramsList, callback || function() {
				});
			});
		} else {
			if (!cache.isLoaded) {
				process.lockNext(url, 'url', function() {
					_private.invokeByCommonAPI.call(this, method, paramsList, callback || function() {
					}, noDeferred);
				}, function(callback) {
					var scriptCallback = function() {
						cache.isLoaded = true;
                        // 兼容以前的老qqapi，在非手机环境下不暴露接口
                        if(!(mqq.iOS || mqq.android)) {
                            window.mqq = {};
                        }
                        if(mqq.android) {
							JsBridge.restoreApis({'QQApi': ['getAppsVerionCodeBatch', 'launchAppWithTokens']}, '4.6');
							//todo LayenLin 添加于周迭代供客户端测试，测试后需要在发布前回滚
							if (that.getWebView() == 'gameCenter') {
								JsBridge.restoreApis({'GCApi': ['setClientWebviewPull', 'showWarningToast', 'getReportPublicHighData', 'getReportPublicData', 'getSid', 'getUin', 'getOpenidBatch', 'getVersionName', 'startToAuthorized']}, '4.6');
								JsBridge.restoreApis({'q_download': ['registerDownloadCallBackListener', 'getQueryDownloadAction', 'doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion', 'checkUpdate']}, '4.6');
							}else{
								//外面的webview也要q_download, 但是回调机制不一样
								JsBridge.restoreApis({'q_download': ['registerDownloadCallBackListener', 'getQueryDownloadAction', 'doGCDownloadAction', 'doDownloadAction', 'getDownloadVersion', 'checkUpdate']}, '4.7');
							}
							//应用宝上报数据
							JsBridge.restoreApis({'qqZoneAppList': ['reportForVia']}, '5.0');
						}
						if( /PA/.test( window.navigator.userAgent )){
							
							window.q_download && ( window.q_download.doGCDownloadAction  = null );
							
						}
						callback();
					};
					
					if(window.mqq){
						scriptCallback();
					}
					else{
						net.getScript(url, scriptCallback);
					}
				});
			} else {
				_private.invokeByCommonAPI.call(this, method, paramsList, callback || function() { }, noDeferred);
			}
		}
	};

	/**
	 * 获取客户端类型
	 * @return {string} 返回客户端类型（androidqq|iphoneqq）
	 * */
	exports.getClient = function() {
        if(mqq.iOS) {
            return 'iphoneqq';
        } else if(mqq.android) {
            return 'androidqq';
        }
	};

	/**
	 * 获取webview类型
	 * @return {string} webview类型
	 */
	exports.getWebView = function() {
		if (/[?&]_webview=(gameCenter|default)/.test(window.location.href)) {
			return RegExp.$1;
		} else if (typeof(GCApi) !== 'undefined' && GCApi.getClass) {
			// androidQQ4.5以前如果有GCApi则代表在游戏中心
			return 'gameCenter';
		} else if (this.getClient() == 'iphoneqq') {
			// iphoneQQ的webview能力一致
			return 'gameCenter';
		} else if (/\bV1_AND_SQ_.+gamecenter/.test(window.navigator.userAgent)) {
			// androidQQ4.6+新增userAgent标识
			return 'gameCenter';
		} else {
			return 'default';
		}
	};

	_private.completeUrl = function(url) {
		if (url.match(/\w+:\/\//)) {
			//console.log(url)
		} else if (url.indexOf("/") == 0) {
			url = "http://" + location.host + url;
		} else {
			url = location.href.replace(/[^\/]*$/, "") + url;
		}
		return url;
	};
	
	/*
	 * 延时跳转，给数据上报留时间
	 */
	function delayJump(url){
		setTimeout(function(){
			location.href = url;
		}, 100);
	}
	
	/**
	 * 打开url
	 * 已测版本：ios：4.2+ android：所有版本
	 * @param {object} params
	 * @param {string} params.url 跳转的url
	 * @param {int} params.target (只对ios有效)
	 * 							0: 在当前webview打开（默认）;
	 *							1: 在新webview打开;
	 *							2: 在外部浏览器上打开（iOS为Safari,Android为系统默认浏览器）;
	 * */
	exports.openUrl = function(params) {
		if (this.getClient() == 'iphoneqq') {
			this._invokeByCommonAPI('mqq.ui.openUrl', [{
					url: _private.completeUrl(params.url) || '',
					target: params.target || 0,
					style: 1
			}], function(json) {
				if (json.result != 0) {
					delayJump(params.url);
				}
			});
		} else if(typeof params.newWindow == "undefined" || params.newWindow === false){
			//加参数标记不使用新窗口打开
			delayJump(params.url);
		}else{
            if(this.compareVersion('4.7') >= 0) {
                this._invokeByCommonAPI('mqq.ui.openUrl', [{
                        url: _private.completeUrl(params.url) || '',
                        target: params.target || 0,
                        style: 1
                }], function(json) {
                    if (json.result != 0) {
                        delayJump(params.url);
                    }
                });
            } else {
                //不采取新的webview打开
                delayJump(params.url);
            }
		}
	};

	


	/**
	 * 获取qq版本号
	 * 已测试版本：
	 * 			android：4.2离线版、4.2在线版
	 * 			ios：4.2离线版、4.2在线版、4.6离线版、4.6在线版
	 * @param {function} callback 回调函数
	 * @return {json} {"result":0,"data":"0.0.0"}
	 * @return 说明：json.data为QQ版本号
	 * @example
	 *  getQQVersion(function(json) {
	 *      if (json.result == 0) {
	 *          version = json.data;//版本号
	 *      }
	 *  })
	 */
	exports.getQQVersion = function(callback) {
        var qqVer = String(mqq.QQVersion).split('.').slice(0, 3).join('.');
        if(callback) {
            callback({
                result: 0,
                data: qqVer
            });
        }
        return qqVer;
	};

	/**
	 * 获取系统版本号
	 * 已测试版本
	 *        android: 4.2离线版、4.2在线版、4.5离线版、4.5在线版、4.6离线版、4.6在线版
	 *        ios: 4.2离线版、4.2在线版、4.5离线版、4.5在线版、4.6离线版、4.6在线版
	 * @param {function} callback 回调函数
	 * @return {json} {"result":0,"data":"0.0.0"}
	 * @return 说明：json.data为系统版本号
	 * @example
	 *  getSystemVersion(function(json) {
	 *      if (json.result == 0) {
	 *          version = json.data;//版本号
	 *      }
	 *  })
	 */
	exports.getSystemVersion = function(callback) {
		if (this.getClient() == 'iphoneqq') {
			this._invokeByCommonAPI('mqq.device.getDeviceInfo', [], function(json) {
				if (json.result == 0) {
					callback({result: 0, data: json.data?json.data.systemVersion:""});
				} else {
					callback(json);
				}
			})
		} else {
			if (_private.isAsyncApi()) {
				//4.6+ 异步调用游戏中心webview接口
				exports._invokeByCommonAPI('GCApi.getReportPublicHighData', [function(json) {
					var dataList = json.split('|');
					if (dataList.length > 2) {
						callback({result: 0, data: dataList[2]});
					} else {
						exports._invokeByCommonAPI('mqq.device.getDeviceInfo', [function(json) {
							callback({result: 0, data: json.systemVersion});
						}], function(json) {
							if (json.result != 0) {
								callback(json);
							}
						})
					}
				}], function(json) {
					if (json.result != 0) {
						if (json.result == 1 || json.result == 2) {
							exports._invokeByCommonAPI('mqq.device.getDeviceInfo', [function(json) {
								callback({result: 0, data: json.systemVersion});
							}], function(json) {
								if (json.result != 0) {
									callback(json);
								}
							})
						} else {
							callback(json);
						}
					}
				});
			} else {
				exports._invokeByCommonAPI('GCApi.getReportPublicHighData', [], function(json) {
					if (json.result == 0) {
						var dataList = json.data.split('|');
						if (dataList.length > 2) {
							callback({result: 0, data: dataList[2]});
						} else {
							callback({result: -1, message: 'getSystemVersion error'});
						}
					}
				});
			}
		}
	};

	/**
	 * 获取设备类型
	 * @param {function} callback 回调函数
	 * @example
	 *  getDeviceModel(function(json) {
	 *      if (json.result == 0) {
	 *          device = json.data;//设备类型
	 *      }
	 *  })
	 */
	exports.getDeviceModel = function(callback) {
		if (this.getClient() == 'iphoneqq') {
			this._invokeByCommonAPI('mqq.device.getDeviceInfo', [], function(json) {
				if (json.result == 0) {
					callback({result: 0, data: json.data?json.data.model:""});
				} else {
					callback(json);
				}
			})
		} else {
			if (_private.isAsyncApi()) {
				//4.6+ 异步调用游戏中心webview接口
				exports._invokeByCommonAPI('GCApi.getReportPublicData', [function(json) {
					var dataList = json.split('|');
					if (dataList.length > 3) {
						callback({result: 0, data: dataList[3]});
					} else {
						exports._invokeByCommonAPI('mqq.device.getDeviceInfo', [function(json) {
							callback({result: 0, data: json.model});
						}], function(json) {
							if (json.result != 0) {
								callback(json);
							}
						})
					}
				}], function(json) {
					if (json.result != 0) {
						if (json.result == 1 || json.result == 2) {
							exports._invokeByCommonAPI('mqq.device.getDeviceInfo', [function(json) {
								callback({result: 0, data: json.model});
							}], function(json) {
								if (json.result != 0) {
									callback(json);
								}
							})
						} else {
							callback(json);
						}
					}
				});
			} else {
				exports._invokeByCommonAPI('GCApi.getReportPublicData', [], function(json) {
					if (json.result == 0) {
						var dataList = json.data.split('|');
						if (dataList.length > 3) {
							callback({result: 0, data: dataList[3]});
						} else {
							callback({result: -1, message: 'getSystemVersion error'});
						}
					}
				});
			}
		}
	};

	/**
	 * 获取系统版本号（android 离线版 4.6之前不支持）
	 * @param {function} callback 回调函数
	 * @return {json}
	 * @return 说明：json.data（'none'|'wifi'|'2g'|'3g'|'unkown'）
	 * @example
	 *  getNetworkType(function(json) {
	 *      if (json.result == 0) {
	 *          networkType = json.data;//网络类型
	 *      }
	 *  })
	 */
	exports.getNetworkType = function(callback) {
		var netType = ['none', 'wifi', '2g', '3g', 'unkown'];
		if (this.getClient() == 'iphoneqq') {
			exports._invokeByCommonAPI('mqq.device.getNetworkType', [], function(json) {
				if (json.result == 0) {
					callback({result: 0, data: netType[json.data||0]});	//QQ4.2.2  null的情况
				} else {
					callback(json);
				}
			});
		} else {
			if (_private.isAsyncApi()) {
				//4.6+ 异步调用游戏中心webview接口
				exports._invokeByCommonAPI('GCApi.getReportPublicHighData', [function(json) {
					var dataList = json.split('|');
					if (dataList.length > 1) {
						//此处的API对于非wifi网、无网都会返回cmnet
						var dr = (dataList[1] == "cmnet" && (dataList[0] == "null" || dataList[0] === null) ) ? "none" : dataList[1];
						callback({result: 0, data: dr});
					} else {
						//4.6+ 调应用部中心webview接口
						exports._invokeByCommonAPI('mqq.device.getNetworkType', [function(json) {
							callback({result: 0, data: netType[json]});
						}], function(json) {
							if (json.result != 0) {
								callback(json);
							}
						})
					}
				}], function(json) {
					if (json.result != 0) {
						//4.6之前 调应用部中心webview接口
						if (json.result == 1 || json.result == 2) {
							exports._invokeByCommonAPI('mqq.device.getNetworkType', [function(json) {
								callback({result: 0, data: netType[json]});
							}], function(json) {
								if (json.result != 0) {
									callback(json);
								}
							})
						} else {
							callback(json);
						}
					}
				});
			} else {
				//4.6前， 同步调用游戏中心webview接口
				exports._invokeByCommonAPI('GCApi.getReportPublicHighData', [], function(json) {
					if (json.result == 0) {
						var dataList = json.data.split('|');
						if (dataList.length > 1) {
							//此处的API对于非wifi网、无网都会返回cmnet
							var dr = (dataList[1] == "cmnet" && (dataList[0] == "null" || dataList[0] === null) ) ? "none" : dataList[1];
							callback({result: 0, data: dr});
						} else {
							callback({result: -1, message: 'getNetworkType error'});
						}
					}
				});
			}
		}
	};

	/**
	 * 设置下拉刷新 (目前只有android 离线版 4.6+ 支持)
	 * @param {boolean} params 是否可以下拉刷新（true|false）
	 * @param {function} callback 回调函数
	 */
	exports.setClientWebviewPull = function(params, callback) {
		//todo 补充逻辑
		if (exports.getClient() == 'androidqq') {
			exports._invokeByCommonAPI('GCApi.setClientWebviewPull', [params], function(json) {
				callback(json);
			})
		} else {
			callback({result: 4, message: 'no support'});
		}
	};

	/**
	 * 获取用户的信息
	 * 支持版本：android：离线版，支持获取uin，sid
	 *           ios：4.3+支持获取uin，不支持sid
	 * @param {function} callback 回调函数
	 * @example
	 *  getUserInfo(function(json) {
	 *      if (json.result == 0) {
	 *          var uin = json.data.uin;//uin
	 *      }
	 *  })
	 */
	exports.getUserInfo = function(callback) {
		if (this.getClient() == 'iphoneqq') {
			this._invokeByCommonAPI('mqq.data.getUserInfo', [], function(json) {
				callback(json);
			});
		} else {
			if (_private.isAsyncApi()) {
				this._invokeByCommonAPI('GCApi.getUin', [function(json) {
					var uin = parseInt(json)||0;
					exports._invokeByCommonAPI('GCApi.getSid', [function(json) {
						callback({result: 0, data: {uin: uin, sid: json}});
					}], function(json) {
						if (json.result != 0) {
							callback(json);
						}
					});
				}], function(json) {
					if (json.result != 0) {
						callback(json);
					}
				});
			} else {
				this._invokeByCommonAPI('GCApi.getUin', [], function(json) {
					if (json.result == 0) {
						var uin = parseInt(json.data)||0;
						exports._invokeByCommonAPI('GCApi.getSid', [], function(json) {
							if (json.result == 0) {
								callback({result: 0, data: {uin: uin, sid: json.data}});
							} else {
								callback({result: 0, data: {uin: uin, sid: 0}});
							}
						});
					} else {
						callback(json);
					}
				});
			}
		}
	};

	/**
	 * 比较当前的QQ版本号
	 * @param {string} version 比较的版本号
	 * @param {function} callback 回调函数
	 * @property {object} callback.json json
	 * @property {number} callback json.result
	 * @property {number} callback json.data 比较的结果（-1：小于;0：等于;1：大于）
	 * @example
	 *  getUserInfo(function(json) {
	 *      if (json.result == 0) {
	 *          // json.data
	 *      }
	 *  })
	 */
	exports.compareVersion = function(version, callback) {
        var ret = mqq.compare(version);
        if(callback) {
            callback({
                result: 0,
                data: ret
            });
        }
        return ret;
	};

	/**
	 * 打开指定uin的资料卡
	 * 支持 ios 4.5+、android (其他：4.6+；游戏中心：4.7+)
	 * 已测试支持的版本：ios 4.5/4.6（aio、游戏中心、公众帐号）android 4.7/4.6（aio、游戏中心、公众帐号）
	 * 已测试不支持的返回：ios 4.2
	 * @param {object} params 请求参数
	 * @param {string} params.uin uin
	 * @param {number} params.uinType 默认为个人资料卡，指定为 1 则打开群资料卡
	 * */
	exports.showProfile = function(params, callback) {
		var that = this;
		var showProfile = function() {
			that._invokeByCommonAPI('mqq.ui.showProfile', [params], function(json) {
				if (json && json.result != 0) {
					callback({result: -1, message: 'no such method'});
				} else {
					callback(json);
				}
			});
		};
		if (that.getClient() == 'iphoneqq') {
            if(this.compareVersion('4.6') >= 0) {
                // 4.6以上版本qqapi里面可以
                showProfile();
            } else {
                if(this.compareVersion('4.5') >= 0) {
                    //todo src_type和version含义需确认，不带这两个参数就打不开
                    window.location.href = 'mqqapi://card/show_pslcard?src_type=web&version=1&uin=' + encodeURIComponent(params.uin || 0);
                    callback({result: 0, message: 'success'});
                } else {
                    callback({result: -1, message: 'no such method'});
                }
            }
		} else {
			if (that.getWebView() == 'gameCenter') {
				//游戏中心webview 4.7以上才支持，但是4.6版本却存在这个方法，所以需要版本过滤
                if(this.compareVersion('4.7') >= 0) {
                    showProfile();
                } else {
                    callback({result: -1, message: 'no such method'});
                }
			} else {
				//应用部webview 4.6+支持，比较版本的原因：4.2版本不无游戏中心webview标识，所以会走到这个逻辑，qqapi就会注册这个方法到页面上，但是实际上无此方法。
                if(this.compareVersion('4.7') >= 0) {
                    showProfile();
                } else {
                    if(this.compareVersion('4.6') >= 0) {
                        window.location.href = 'mqqapi://card/show_pslcard?uin=' + encodeURIComponent(params.uin || 0);
                        callback({result: 0, message: 'success'});
                    } else {
                        callback({result: -1, message: 'no such method'});
                    }
                }
			}
		}
	};

	/**
	 * 关闭当前webview(与openUrl接口相对应)
	 * 已测试支持的版本： android 4.7（aio、公众帐号、游戏中心）ios 4.5/4.6.2（aio、公众帐号、游戏中心）
	 * 已测试不支持的返回： ios 4.2
	 * */
	exports.closeWebview = function(callback) {
		var that = this;
		if (that.getClient() == 'iphoneqq') {
			that._invokeByCommonAPI('mqq.ui.popBack', [], function(json) {
				if (json && json.result == 0) {
					callback({result: 0, message: 'success'});
				} else {
					callback({result: -1, message: 'no such method'});
				}
			});
		} else {
            if(this.compareVersion('4.7') >= 0) {
                this._invokeByCommonAPI('mqq.ui.popBack', [], function(json) {
                    if (json && json.result == 0) {
                        callback({result: 0, message: 'success'});
                    } else {
                        callback({result: -1, message: 'no such method'});
                    }
                });
            } else {
                callback({result: -1, message: 'no such method'});
            }
		}
	};

	/**
	 * 获取当前的经纬度
	 * 支持 ios 4.5+、android（aio/公众帐号：4.6+；游戏中心：4.7+）
	 * 注：status 是4.7才增加的
	 * 已测试支持的版本：ios 4.5/4.6、android4.7/4.6/4.5
	 * 已测试不支持的返回：ios 4.2
	 * @param {function} callback 回调函数
	 * */
	exports.getLocation = function(callback) {
		var that = this;
		var getLocation = function() {
			that._invokeByCommonAPI('mqq.sensor.getLocation', [function(retCode, latitude, longitude, status) {
				if (retCode == 0) {
					callback({
						result: retCode,
						data: {
							latitude: latitude,
							longitude: longitude,
							status: status || null
						}
					});
				} else {
					callback({
						result: 2,
						data: {
							latitude: latitude,
							longitude: longitude,
							status: status || null
						}
					});
				}
			}], function(json) {
				if (json && json.result != 0) {
					callback({result: -1, message: 'no such method'});
				}
			});
		};
		if (that.getClient() == 'iphoneqq') {
			// ios 4.5+ 都支持
			getLocation();
		} else {
			if (that.getWebView() == 'gameCenter') {
				//游戏中心webview 4.7以上才支持，但是4.6版本却存在这个方法，所以需要版本过滤
				that.compareVersion('4.7', function(json) {
					if (json && json.result == 0 && json.data >= 0) {
						getLocation();
					} else {
						callback({result: -1, message: 'no such method'});
					}
				});
			} else {
				//应用部webview 4.6+支持，比较版本的原因：4.2版本不无游戏中心webview标识，所以会走到这个逻辑，qqapi就会注册这个方法到页面上，但是实际上无此方法。
				that.compareVersion('4.6', function(json) {
					if (json && json.result == 0 && json.data >= 0) {
						getLocation();
					} else {
						callback({result: -1, message: 'no such method'});
					}
				});
			}
		}
	};
});

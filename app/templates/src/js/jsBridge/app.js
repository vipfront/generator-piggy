/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-15
 * Time: 下午1:03
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {
	/** @module jsBridge/app */
	var _private = {};
	var $ = require('lib/zepto');
	var ctrl = require('lib/ctrl');
	var common = require('jsBridge/common');
	var process = require('util/process');
	
	function alog(){
		return;
		var args = [];
		for (var i = 0; i < arguments.length; i++){
			if(typeof arguments[i] == 'object'){
				args.push(JSON.stringify(arguments[i]))
			}
			else{
				args.push(arguments[i]+'');
			}
		}
         
		alert(args.join(' '));
	}
	
	/**
	 * 启动App
	 * 已测试版本：
	 * 			android：4.2 离线版、4.2 在线版、4.5 离线版、4.5 在线版、4.6 离线版、4.6 在线版
	 * 			ios：4.2 在线版、4.2 离线版、4.5 离线版、4.5 在线版、4.6 离线版、4.6 在线版
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.tickets 自动附加的登录信息，例如：OPID,AT
	 * @param {string} params.openId openId
	 * @param {function} callback 回调函数
	 * @example
	 *  launch({appId: '100732256', pkgName: 'com.tencent.hero', ticketList: 'OPID,AT', openId: ''}, function(json, params) {
	 *      if (json && json.result === 0) {
	 *          //success
	 *      }
	 *  });
	 */
	exports.launch = function(params, callback) {
		//延时启动，给数据上报留时间
		setTimeout(function(){
			_private.launch(params, callback);
		}, 100);
	};
	
	_private.launch = function(params, callback) {
		//添加票据信息
		var tickets = params.tickets.split(",");
		var paramArray = ["platform=qq_m&current_uin=$OPID$"];
		//添加游戏的传入信息,这里传入的时候，如果没有这两个参数，就写空格
		paramArray.push( 'gamedata='     + encodeURIComponent( params.gamedata || "" ) );
		paramArray.push( 'platformdata=' + encodeURIComponent( params.platformdata || "" ) );
		

		switch (common.getClient()) {
			case 'androidqq':
				_private.launchForAndroid(params, paramArray, callback);
				break;
			case 'iphoneqq':
				_private.launchForIOS(params, paramArray, callback);
				
				break;
			default :
				break;
		}
	};
	_private.ticketMap = {
		"OPID": "openid=$OPID$",
		"AT": "atoken=$AT$",
		"PT": "ptoken=$PT$",
		"PF": "pfkey=$PF$",
		"ESK": "skey=$ESK$"
	};
	_private.launchForIOS = function(params, paramArray, callback){
		function quickLaunch(){
			var request = {};
			var tickets = params.tickets.split(",");
			var paramArray = ["platform=qq_m&user_openid=$OPID$"];
			//添加游戏的传入信息,这里传入的时候，如果没有这两个参数，就写空格
			paramArray.push( 'gamedata='     + encodeURIComponent( params.gamedata || "" ) );
			paramArray.push( 'platformdata=' + encodeURIComponent( params.platformdata || "" ) );
			
			request.appID = params.appId;
			request.flag = '536870912';
			request.packageName = params.pkgName;
			//添加票据信息
			alog('tickets:', tickets)
			for (var i = 0; i < tickets.length; i++) {
				paramArray.push(_private.ticketMap[tickets[i]] || "");
			}
			request.paramsStr = '?' + paramArray.join('&');
			alog('launch param:', request);
			common._invokeByCommonAPI('mqq.app.launchAppWithTokens', [request], function(json) {
				if (json.result != 0 || (json.result == 0 && json.data == null)) {
					commonLaunch();
				} else {
					callback(json);
				}
			});
		}
		
		function commonLaunch(){
			alog('commonLaunch');
			var request = {};
			var paramArray = ["platform=qq_m&user_openid=$OPID$"];
			//添加游戏的传入信息,这里传入的时候，如果没有这两个参数，就写空格
			paramArray.push( 'gamedata='     + encodeURIComponent( params.gamedata || "" ) );
			paramArray.push( 'platformdata=' + encodeURIComponent( params.platformdata || "" ) );
			
			request.appID = params.appId;
			request.flag = '536870912';
			request.packageName = params.pkgName;
			//不支持快速启动的只传OPID参数
			paramArray.push(_private.ticketMap['OPID'] || "");
			request.paramsStr = '?' + paramArray.join('&');
			alog('launch param:', request);
			common.getQQVersion(function(json) {
				if (json && json.result == 0 && json.data) {
					if (_private.compareVersion(json.data, '4.6') >= 0) {
						common._invokeByCommonAPI('mqq.app.launchAppWithTokens', [request], function(json) {
							if (json.result != 0 || (json.result == 0 && json.data == null)) {
								window.location.href = "tencent" + params.appId + "://?platformId=qq_m&user_openid=" + params.openId;
							} else {
								callback(json);
							}
						});
					} else {
						window.location.href = "tencent" + params.appId + "://?platformId=qq_m&user_openid=" + params.openId;
					}
				} else {
					window.location.href = "tencent" + params.appId + "://?platformId=qq_m&user_openid=" + params.openId;
				}
			});
		}
		
		ctrl([function(step){
			step.data.isSupportQuickLaunch = false;
			common._invokeByCommonAPI('mqq.app.isAppInstalled', ['tencentlaunch'+params.appId, function(json){
				step.data.isSupportQuickLaunch = json;
				step.next();
			}]);
		}, function(step){
			alog('tencentlaunch scheme check:', step.data.isSupportQuickLaunch)
			if(step.data.isSupportQuickLaunch){
				quickLaunch();
			}
			else{
				commonLaunch();
			}
		}]);
	};
	
	_private.launchForAndroid = function(params, paramArray, callback){
		ctrl([function(step){
			//获取游戏支持快速启动的版本
			var launchVersion;
			step.data.remoteLaunchVersion = -1;
			if(params.launchVersion != undefined && params.launchVersion != ''){
				step.data.remoteLaunchVersion = parseInt(params.launchVersion);
			}
			step.next();
		}, function(step){
			//获取用户本地已安装游戏的版本
			step.data.localVersion = -1;
			exports.getVersion(params.pkgName, function(json){
				if(json.result == 0){
					step.data.localVersion = json.data;
				}
				step.next();
			});
		}, function(step){
			alog('local:', step.data.localVersion, 'remote:', step.data.remoteLaunchVersion);
			//拼接参数
			var tickets;
			
			if(
				step.data.remoteLaunchVersion == -1 || 
				step.data.localVersion == -1 ||
				step.data.localVersion < step.data.remoteLaunchVersion
			){
				//不支持快速启动的只传OPID参数
				paramArray.push(_private.ticketMap['OPID']);
			}
			else{
				//支持快速启动的传所有配置参数
				tickets = params.tickets.split(",");
				alog('tickets:', tickets);
				for (var i = 0; i < tickets.length; i++) {
					paramArray.push(_private.ticketMap[tickets[i]] || "");
				}
			}
			step.next();
		}, function(step){
			//尝试通过launchAppWithTokens启动游戏
			var args = [params.appId, paramArray.join('&'), params.pkgName, '603979776'];
			alog('launchAppWithTokens:', args);
			common._invokeByCommonAPI('QQApi.launchAppWithTokens', args, function(json) {
				if(json.result == 0){
					callback(json);
					return;
				}
				if(json.result == 1 || json.result == 2){
					step.next();
				}
			});
		}, function(step){
			//尝试通过其他方式启动游戏
			if (params.openId) {
				alog('startAppWithPkgNameAndOpenId');
				common._invokeByCommonAPI('QQApi.startAppWithPkgNameAndOpenId', [params.pkgName, params.openId], function(json) {
					if (json && json.result != 0) {
						step.next();
					} else {
						callback(json);
					}
				})
			} else {
				alog('startAppWithPkgName');
				common._invokeByCommonAPI('QQApi.startAppWithPkgName', [params.pkgName], function(json) {
					if (json && json.result != 0) {
						step.next();
					} else {
						callback(json);
					}
				})
			}
		}, function(step){
			//尝试通过QQ浏览器接口启动游戏
			$(document).ready(function() {
				alog('x5mtt.runApk');
				common._invokeByCommonAPI('x5mtt.runApk', [JSON.stringify({packagename: params.pkgName})], function(json) {
					callback(json);
				});
			});
		}]);
		
	};
	
	_private.compareVersion = function(a, b) {
		a = String(a).split('.');
		b = String(b).split('.');
		try {
			for (var i = 0, len = Math.max(a.length, b.length); i < len; i++) {
				var l = isFinite(a[i]) && Number(a[i]) || 0,
					r = isFinite(b[i]) && Number(b[i]) || 0;
				if (l < r) {
					return -1;
				} else if (l > r) {
					return 1;
				}
			}
		} catch (e) {
			return -1;
		}
		return 0;
	}

	/**
	 * 判断app是否已安装
	 * 已测：ios(4.6/4.5/4.2) android(4.6/4.5/4.2/QQ浏览器打开)
	 * @param {string|array} identifier identifier，ios填应用的scheme，android填pkgName
	 * @param {function} callback
	 * @example
	 *  isInstalled('com.tencent.hero', function(json, params) {
	 *      if (json && json.result == 0) {
	 *          if (json.data) {
	 *              //success
	 *          }
	 *      }
	 *  });
	 * @example
	 *  isInstalled(['com.tencent.hero', 'com.tencent.hero'], function(json, params) {
	 *      if (json && json.result == 0) {
	 *          if (json.data['com.tencent.hero']) {
	 *              //success
	 *          }
	 *      }
	 *  });
	 */
	exports.isInstalled = function(params, callback) {
		var paramsList = params;
		if (!$.isArray(paramsList)) {
			paramsList = [paramsList];
		}
		if (paramsList.length == 0) {
			callback({result:-1, message: 'params error'});
			return false;
		}
		if (common.getClient() == 'iphoneqq') {
			common._invokeByCommonAPI('mqq.app.isAppInstalledBatch', [paramsList], function(json) {
				if (json.result == 0) {
					var data = {};
					for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
						data[paramsList[i]] = !!json.data[i];
					}
					if (paramsList !== params) {
						callback({result: 0, data: data[params]});
					} else {
						callback({result: 0, data: data});
					}
				} else {
					callback(json);
				}
			});
		} else {
			if (_private.isAsyncApi()) {
				common._invokeByCommonAPI('QQApi.isAppInstalledBatch', [paramsList.join('|'), function(result) {
					var resultList = result.split('|');
					var data = {};
					for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
						data[paramsList[i]] = (resultList[i] == 1);
					}
					if (paramsList !== params) {
						callback({result: 0, data: data[params]});
					} else {
						callback({result: 0, data: data});
					}
				}], function(json) {
					if (json.result != 0) {
						//手Q有捆绑QQ浏览器 ,为了兼容用户直接打开 在线版链接的情况
						$(document).ready(function() {
							if (typeof(x5mtt) != 'undefined' && typeof(x5mtt.isApkInstalled) == "function") {
								var data = {};
								for (var i = 0; i < paramsList.length; i++) {
									data[paramsList[i]] = (x5mtt.isApkInstalled('{"packagename":"' + paramsList[i] + '"}') == 1);
								}
								if (paramsList !== params) {
									callback({result: 0, data: data[params]});
								} else {
									callback({result: 0, data: data});
								}
							} else {
								callback(json);
							}
						});
					}
				});
			} else {
				common._invokeByCommonAPI('QQApi.isAppInstalledBatch', [paramsList.join('|')], function(json) {
					if (json.result == 0) {
						var resultList = json.data.split('|');
						var data = {};
						for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
							data[paramsList[i]] = resultList[i] == 1;
						}
						if (paramsList !== params) {
							callback({result: 0, data: data[params]});
						} else {
							callback({result: 0, data: data});
						}
					} else {
						callback(json);
					}
				});
			}
		}
	};

	_private.getDownloaderVersion = function(callback) {
		var cache = arguments.callee;
		if (cache.json) {
			callback(cache.json);
		} else {
			process.lockNext('q_download.getDownloadVersion', 'jsBridge/app/getDownloaderVersion', function(json) {
				callback(cache.json = json);
			}, function(callback) {
				common._invokeByCommonAPI('q_download.getDownloadVersion', [function(version) {
					callback({result: 0, data: version});
				}], function(json) {
					if (json && json.result !== 0) {
						callback({result: 0, data: 0});
					}
				});
			});
		}
	};

	_private.registerQzoneApiEvent = function(event, callback) {
		var cache = arguments.callee;
		if (!cache.isInit) {
			window.Downloader = {};
			window.QzoneApp = {
				fire: function(eventId, queryData) {
					if (typeof(queryData) != 'object') {
						queryData = eval('(' + queryData + ')');
					}
					if (!eventId || !queryData) {
						return;
					}
					if (eventId == 'interface.getQueryDownloadAction' && typeof(window.Downloader.callbackFunc) == 'function') {
						if (!(queryData.data)) {
							return;
						}
						window.Downloader.callbackFunc(queryData.data, true);
					} else if (eventId == 'interface.checkUpdate' && typeof(window.Downloader.updateCallbackFunc) == 'function') {
						if (!(queryData.data)) {
							return;
						}
						window.Downloader.updateCallbackFunc(queryData.data);
					} else if (eventId == 'loadProcess') {
						var data = {
							pkgName: queryData.packagename,
							state: queryData.state, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装, 20：等待中
							progress: queryData.pro
						}
						exports.triggerChangeListener({result: 0, data: data});
					}
				}
			};
			cache.isInit = true;
		}
		window.Downloader[event] = callback;
	};

	/**
	 * 检测更新，必须有安装的才能检测(4.6+)
	 *	已测试版本：
	 *				4.6 android离线版
	 * @param {string|array<string>} pkgName
	 * @param {function} callback 回调函数
	 * @example
	 * checkUpdate('com.tencent.hero', function(json) {
	 *     window.alert(JSON.stringify(json));
	 * });
	 */
	exports.checkUpdate = function(pkgName, callback) {
		if (common.getClient() == 'androidqq') {
			var paramsList = pkgName;
			if (!$.isArray(paramsList)) {
				paramsList = [paramsList];
			}
			if (paramsList.length == 0) {
				callback({result:-1, message: 'params error'});
				return false;
			}
			process.lockMultiple('q_download.checkUpdate', 'jsBridge/app/checkUpdate', function(json) {
				if (json && json.result == 0 && json.data) {
					var data = {};
					for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
						data[paramsList[i]] = {
							pkgName: json.data[i].packageName,
							newApkSize: json.data[i].newapksize,
							patchSize: json.data[i].patchsize,
							updateMethod: json.data[i].updatemethod,
							versionCode: json.data[i].versioncode,
							versionName: json.data[i].versionname,
							fileMd5: json.data[i].fileMd5,
							sigMd5: json.data[i].sigMd5,
							url: json.data[i].url
						}
					}
					if (paramsList !== pkgName) {
						callback({result: 0, data: data[pkgName]}, pkgName);
					} else {
						callback({result: 0, data: data}, pkgName);
					}
				}else {
					callback(json, pkgName);
				}
			}, function( callback ) {
				_private.registerQzoneApiEvent.call(this, 'updateCallbackFunc', function(json) {
					var data = json ? JSON.parse(json) : null;
					callback({result:0, data:data});
				});
				common._invokeByCommonAPI('q_download.checkUpdate', [JSON.stringify({packageNames: paramsList}), '1'], function(json) {
					if (!json || json.result != 0) {
						// 不支持的情况
						callback(json);
					}
				});
			});

		} else {
			callback({result: 4, message: 'no support'});
		}
	};

	/**
	 * 开始下载app
	 * 已测试版本：
	 * 			android：4.2在线版、4.2离线版、4.5在线版、4.5离线版、4.6在线版、4.6离线版
	 * 			ios：各版本原理一致，已测试4.6版本
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.url url
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.appName app名称
	 * @param {string} params.yybAppId 应用宝appId
	 * @param {string} params.yybApkId 应用宝apkId
	 * @param {string} params.yybVersionCode 应用宝版本
	 * @param {string} params.source 下载来源
	 * @param {string} params.target 启动下载后跳哪里，0：应用宝详情页，1：应用宝下载管理
	 * @param {function} callback 回调函数
	 * @example
	 * startDownload({
	 *     appId: '100732256',
	 *     url: 'http://dlied5.qq.com/qmyx/android/26002/V2.3.9/QHero_v2.3.9_26002_10000144.apk',
	 *     pkgName: 'com.tencent.hero',
	 *     appName: '全名英雄',
	 *     yybAppId: '10195498',
	 *     yybApkId: '0',
	 *     yybVersionCode: '7',
	 *     source: 'ANDROIDQQ.GAME.HOME',
	 *     target: 0
	 * }, function(json, params) {
	 *     // 失败才回调
	 *     window.alert(JSON.stringify(json));
	 * });
	 */
	exports.startDownload = function(params, callback) {
		var that = this;
		switch (common.getClient()) {
			case 'iphoneqq':
				//todo 用一个专门的状态码标识已启动下载，但是不知道结果
				//window.open(params.url);	//ios 4.x  5.x不支持window.open
				window.location.href = params.url;
				break;
			case 'androidqq':
				_private.getDownloaderVersion(function(json) {
					if (json && json.data && (params.downloadChannel != 1) ) {
						// 新版下载器
						var data = {
							appid: String(params.appId),
							url: params.url,
							packageName: params.pkgName,
							actionCode: 2,	// 2:下载; 3:暂停 5:安装 9:卸载 10:取消下载
							via: params.source,
							appName: params.appName,
							myAppConfig: 1,	//应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
							notifyKey: 'N_' + params.appId,
							updateData: '',	//通过更新SDK查询的更新结果，可不填？
							updateType: '0',	//是否使用增量更新功能，0不使用、1使用  例子代码没有
							//以下为跳转应用宝相关参数
							wording : params.wording || "",
							myAppId: params.yybAppId || '',	//应用宝Id
							apkId: params.yybApkId || '',	//应用宝下载包apkid;
							versionCode: params.yybVersionCode || '',	//应用宝versionCode;
							isAutoDownload: 1,
							isAutoInstall: 1,
							toPageType: params.target || 0,	//游戏中心列表也下载时，跳往应用宝详情页；游戏中心详情页下载时跳往应用宝下载管理器
							sourceType: 2
						};
						that.isInstalled(params.pkgName, function(json) {
							if (json && json.result == 0 && json.data) {
								that.checkUpdate(params.pkgName, function(json) {
									if (json && json.data && (json.data == 2 || json.data.updateMethod == 4)) {
										// 增量更新
										common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify($.extend(true, data, {
											actionCode: 12,
											updateData: {
												packageName: json.data.pkgName,
												newapksize: json.data.newApkSize,
												patchsize: json.data.patchSize,
												updatemethod: json.data.updateMethod,
												versioncode: json.data.versionCode,
												versionname: json.data.versionName,
												fileMd5: json.data.fileMd5,
												sigMd5: json.data.sigMd5,
												url: json.data.url
											}	//通过更新SDK查询的更新结果，可不填？
										}))], function(json) {
											if (json && json.result !== 0) {
												callback(json, params);
											}
										});
									} else {
										// 完整下载
										common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify(data)], function(json) {
											if (json && json.result !== 0) {
												callback(json, params);
											}
										});
									}
								});
							} else {
								// 完整下载
								common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify(data)], function(json) {
									if (json && json.result !== 0) {
										callback(json, params);
									}
								});
							}
						});	
					} else {
						// 旧版下载器
						common._invokeByCommonAPI('q_download.doGCDownloadAction', [JSON.stringify({
							appid: String(params.appId),
							url: params.url,
							packageName: params.pkgName,
							actionCode: 2,	// 2:下载; 3:暂停 5:安装
							via: params.source,
							appName: params.appName,
							myAppConfig: '0',	//应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
							notifyKey: params.appId,
							dType: 0,
							actionType: 900,
							gf: 'gf',
							from: 'gamecenter'
						})], function(json) {
							if (json && json.result !== 0) {
								window.location.href = params.url;
							}
						});
					}
				});
				break;
			default:
				callback({result: 4, message: 'no support'});
		}
	};

	_private.changeCallback = [];

	exports.triggerChangeListener = function(json) {
		for (var i = 0, iMax = _private.changeCallback.length; i < iMax; i++) {
			_private.changeCallback[i](json);
		}
	};

	/**
	 * 注册监听app变化
	 * 已测试版本：
	 * 				android：4.6离线版、4.5离线版（安装暂时不回调）、4.2离线版
	 * @param {function} callback
	 */
	exports.registerChangeListener = function(callback) {
		var cache = arguments.callee;
		var that = this;
		if (!cache.isInit) {
			if (common.getClient() === 'iphoneqq') {
				window.reloadGame = function() {
					that.triggerChangeListener({
						result: 1 // 未知变更内容
					});
				}
			} else {
				//本地有变化时回调。卸载会回调，返回的无appid，有packagename
				//TODO 4.5安装都不回调
				_private.registerQzoneApiEvent.call(this, 'changeCallbackFunc', function(result) {
					if (typeof(result) !== 'object') {
						result = result ? JSON.parse(result) : false;
					}
					if (!result) {
						//todo 确认
						//window.alert('无效通知');
					}

					if ($.isArray(result)) {//下载过程中，可能会有几个同时下载，所以返回数组
						var data = [];
						for (var i = 0; i < result.length; i++) {
							data.push({
								appId: result[i].appid || 0,
								pkgName: result[i].packagename || '',
								state: result[i].state || 0, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装, 20：等待中
								progress: result[i].pro || 0
							});
						}
					} else {//其他变化时，返回对象
						var data = [{
							appId: result.appid || 0,
							pkgName: result.packagename || '',
							state: result.state || 0, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装, 20：等待中
							progress: result.pro || 0
						}];
					}

					that.triggerChangeListener({
						result:0,
						data: data
					});
				});
				common._invokeByCommonAPI('q_download.registerDownloadCallBackListener',['window.Downloader.changeCallbackFunc'], function(json) {});
			}
			cache.isInit = true;
		}
		_private.changeCallback.push(callback);
	};

	/**
	 * 获取下载信息
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.yybAppId 应用宝appId
	 * @param {string} params.yybApkId 应用宝apkId
	 * @param {string} params.yybVersionCode 应用宝versionCode
	 * @param {function} callback
	 * @example
	 * getDownloadInfo({
	 *     appId: '100732256',
	 *     pkgName: 'com.tencent.hero',
	 *     yybAppId: '10195498',
	 *     yybApkId: '0',
	 *     yybVersionCode: '7'
	 * }, function(json, params) {
	 *     window.alert(JSON.stringify(json));
	 * })
	 */
	exports.getDownloadInfo = function(params, callback) {
		var paramsList = params;
		if (!$.isArray(paramsList)) {
			paramsList = [paramsList];
		}
		if (paramsList.length == 0) {
			callback({result:-1, message: 'params error'});
			return false;
		}
		_private.getDownloaderVersion(function(json) {
			//{result:0,data:"3"} QQ5.0
			if (json && json.data) {
				process.lockMultiple('q_download.getQueryDownloadAction', 'jsBridge/app/getDownloadInfo', function(json) {
					if (json && json.result == 0) {
						var index = {};
						for (var i = 0, iMax = (json.data && json.data.length) || 0; i < iMax; i ++) {
							index[json.data[i].appid] = {
								state: json.data[i].state,
								progress: json.data[i].pro
							};
						}
						var data = {};
						for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
							//@todo 已安装的是否会在下载器中？
							// 只有在下载器里面的才会查询到结果
							if (paramsList[i].appId in index) {
								data[paramsList[i].appId] = {
									state: index[paramsList[i].appId].state || 0,	// 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装，20：等待中
									progress: index[paramsList[i].appId].progress || 0
								};
							} else {
								data[paramsList[i].appId] = {
									state: 0,
									progress: 0
								};
							}
						}
						if (paramsList !== params) {
							callback({result: 0, data: data[params.appId]}, params);
						} else {
							callback({result: 0, data: data}, params);
						}
					} else {
						callback(json, params);
					}
				}, function(callback) {
					_private.registerQzoneApiEvent.call(this, 'callbackFunc', function(response) {
						callback({result: 0, data: response});
					});
					var requestList = [];
					for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
						requestList.push({
							appid: paramsList[i].appId,
							myAppId: paramsList[i].yybAppId,
							apkId: paramsList[i].yybApkId,
							versionCode: paramsList[i].yybVersionCode,
							packageName: paramsList[i].pkgName
						});
					}
					//alert(json.data)
					//window.GCApi&&GCApi.showWarningToast(json.data);
					if (json.data == 3) {
						common._invokeByCommonAPI('q_download.getQueryDownloadAction', [JSON.stringify({infolist: requestList, guid: 1})], function(json) {
							if (!json || json.result != 0) {
								// 不支持的情况
								callback(json);
							}
						});
					} else {
						common._invokeByCommonAPI('q_download.getQueryDownloadAction', [JSON.stringify(requestList), '1'], function(json) {
							if (!json || json.result != 0) {
								// 不支持的情况
								callback(json);
							}
						});
					}
				});
			} else {
				var appIdList = [];
				for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
					appIdList.push(paramsList[i].appId);
				}
				common._invokeByCommonAPI('q_download.getQueryDownloadAction', [JSON.stringify(appIdList), false], function(json) {
					if (json && json.result === 0) {
						var response = json.data ? JSON.parse(json.data) || [] : [];
						var index = {};
						for (var i = 0, iMax = response.length; i < iMax; i ++) {
							index[response[i].appid] = {
								state: response[i].state,
								progress: response[i].pro
							};
						}
						var data = {};
						for (var i = 0, iMax = appIdList.length; i < iMax; i++) {
							//@todo 已安装的是否会在下载器中？
							// 只有在下载器里面的才会查询到结果
							if (paramsList[i].appId in index) {
								data[paramsList[i].appId] = {
									state: index[paramsList[i].appId].state || 0,	// 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装
									progress: index[paramsList[i].appId].progress || 0
								};
							} else {
								data[paramsList[i].appId] = {
									state: 0,
									progress: 0
								};
							}
						}
						if (paramsList !== params) {
							callback({result: 0, data: data[params.appId]}, params);
						} else {
							callback({result: 0, data: data}, params);
						}
					} else {
						callback(json, params);
					}
				});
			}
		});
	};

	/**
	 * 暂停下载app
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.url url
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.appName app名称
	 * @param {string} params.yybAppId 应用宝appId
	 * @param {string} params.yybApkId 应用宝apkId
	 * @param {string} params.yybVersionCode 应用宝版本
	 * @param {string} params.source 下载来源
	 * @param {string} params.target 启动下载后跳哪里
	 * @param {function} callback 回调函数
	 */
	exports.stopDownload = function(params, callback) {
		var that = this;
		switch (common.getClient()) {
			case 'iphoneqq':
				//暂时不支持取消下载
				window.open(params.url);
				callback({result: 0});
				break;
			case 'androidqq':
				_private.getDownloaderVersion(function(json) {
					if (json && json.data) {
						// 新版下载器
						var data = {
							appid: params.appId,
							url: params.url,
							packageName: params.pkgName,
							actionCode: 3,	// 2:下载; 3:暂停 5:安装
							via: params.source,
							appName: params.appName,
							myAppConfig: '1',	//应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
							notifyKey: 'N_' + params.appId,
							updateData: '',	//通过更新SDK查询的更新结果，可不填？
							updateType: '0',	//是否使用增量更新功能，0不使用、1使用  例子代码没有
							//以下为跳转应用宝相关参数
							myAppId: params.yybAppId || '',	//应用宝Id
							apkId: params.yybApkId || '',	//应用宝下载包apkid;
							versionCode: params.yybVersionCode || '',	//应用宝versionCode;
							isAutoDownload: '1',
							isAutoInstall: '1',
							toPageType: params.target,	//游戏中心列表也下载时，跳往应用宝详情页；游戏中心详情页下载时跳往应用宝下载管理器
							sourceType: '2'
						};
						common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify(data)], function(json) {
							callback(json);
						});

					} else {
						// 旧版下载器
						common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify({
							appid: params.appId,
							url: params.url,
							packageName: params.pkgName,
							actionCode: 3,	// 2:下载; 3:暂停 5:安装
							via: params.source,
							appName: params.appName,
							notifyKey: params.appId,
							dType: 0,
							actionType: 900,
							gf: 'gf',
							from: 'gamecenter'
						})], function(json) {
							callback(json);
						});
					}
				});
				break;
			default:
				callback({result: 4, message: 'no support'});
		}
	};

	/**
	 * 安装已下载的app
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.url url
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.appName app名称
	 * @param {string} params.yybAppId 应用宝appId
	 * @param {string} params.yybApkId 应用宝apkId
	 * @param {string} params.yybVersionCode 应用宝版本
	 * @param {string} params.source 下载来源
	 * @param {string} params.target 启动下载后跳哪里
	 * @param {function} callback 回调函数
	 */
	exports.install = function(params, callback) {
		var that = this;
		switch (common.getClient()) {
			case 'iphoneqq':
				//暂时不支持
				window.open(params.url);
				callback({result: 0});
				break;
			case 'androidqq':
				_private.getDownloaderVersion(function(json) {
					if (json && json.data && (params.downloadChannel != 1) ) {
						// 新版下载器
						var data = {
							appid: params.appId,
							url: params.url,
							packageName: params.pkgName,
							actionCode: 5,	// 2:下载; 3:暂停 5:安装
							via: params.source,
							appName: params.appName,
							myAppConfig: '1',	//应用宝配置 0不使用，1使用并走安装逻辑， 2使用不走
							notifyKey: 'N_' + params.appId,
							updateData: '',	//通过更新SDK查询的更新结果，可不填？
							updateType: '0',	//是否使用增量更新功能，0不使用、1使用  例子代码没有
							//以下为跳转应用宝相关参数
							myAppId: params.yybAppId || '',	//应用宝Id
							apkId: params.yybApkId || '',	//应用宝下载包apkid;
							versionCode: params.yybVersionCode || '',	//应用宝versionCode;
							isAutoDownload: '1',
							isAutoInstall: '1',
							toPageType: params.target,	//游戏中心列表也下载时，跳往应用宝详情页；游戏中心详情页下载时跳往应用宝下载管理器
							sourceType: '2'
						};
						common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify(data)], function(json) {
							callback(json);
						});

					} else {
						// 旧版下载器
						common._invokeByCommonAPI('q_download.doDownloadAction', [JSON.stringify({
							appid: params.appId,
							url: params.url,
							packageName: params.pkgName,
							actionCode: 5,	// 2:下载; 3:暂停 5:安装
							via: params.source,
							appName: params.appName,
							notifyKey: params.appId,
							dType: 0,
							actionType: 900,
							gf: 'gf',
							from: 'gamecenter'
						})], function(json) {
							callback(json);
						});
					}
				});
				break;
			default:
				callback({result: 4, message: 'no support'});
		}
	};

	/**
	 * 判断本地安装的app版本号，目前只有android 4.6+支持
	 * @param {string|array} identifier identifier，填pkgName
	 * @param {function} callback
	 * @example
	 *  getVersion('com.tencent.hero', function(json, params) {
	 *      if (json && json.result == 0) {
	 *          if (json.data) {
	 *              //success
	 *          }
	 *      }
	 *  });
	 * @example
	 *  getVersion(['com.tencent.hero', 'com.tencent.hero'], function(json, params) {
	 *      if (json && json.result == 0) {
	 *          if (json.data['com.tencent.hero']) {
	 *              //success
	 *          }
	 *      }
	 *  });
	 */
	exports.getVersion = function(params, callback) {
		var paramsList = params;
		if (!$.isArray(paramsList)) {
			paramsList = [params];
		}
		common._invokeByCommonAPI('QQApi.getAppsVerionCodeBatch', [paramsList.join('|'), function(result) {
			var resultList = result.split('|');
			var data = {};
			for (var i = 0, iMax = paramsList.length; i < iMax; i++) {
				data[paramsList[i]] = resultList[i];
			}
			if (paramsList !== params) {
				callback({result: 0, data: data[params]});
			} else {
				callback({result: 0, data: data});
			}
		}], function(json) {
			if (json.result != 0) {
				callback(json, params);
			}
		})
	};

	/**
	 *是否未异步api
	 * 4.6之后把接口都从同步改为异步
	 * */
	_private.isAsyncApi = function() {
		if (window.GCApi && typeof (window.GCApi.getClass) == 'function') {
			return false;
		} else {
			return true;
		}
	};

	/**
	 * 抢号
	 * @param {object} params 参数信息
	 * @param {string} params.appId appId
	 * @param {string} params.pkgName 包名称
	 * @param {string} params.appName app名称
	 * @param {string} params.yybAppId 应用宝appId
	 * @param {string} params.yybApkId 应用宝apkId
	 * @param {string} params.yybVersionCode 应用宝版本
	 * @param {string} params.yybQhqqSlogan 应用宝抢号标语
	 * @param {function} callback 回调函数
	 */
	exports.rob = function(params, callback) {
		var obj = {};
		obj.appid = params.appId + '';
		obj.myAppid = params.yybAppId || '0';
		obj.apkId = params.yybApkId || '';
		obj.versionCode = params.yybVersionCode || '';
		obj.via = params.via || '';
		obj.appName = params.appName;
		obj.appPackageName = params.pkgName || '';
		obj.channelId = '6633';
		obj.appAuthorizedStr = params.yybQhqqSlogan || '';
		if (common.getClient() == 'androidqq') {
			common._invokeByCommonAPI('GCApi.startToAuthorized', [JSON.stringify(obj)], function(json) {
				callback(json);
			});
		} else {
			callback({result: 4, message: 'no support'});
		}
	}
});

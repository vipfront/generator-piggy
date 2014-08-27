/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 13-12-18
 * Time: 上午10:48
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {
	var _private = {};
	var router = require('business/router');

	_private['mqq.ui.openUrl'] = function(params) {
		window.open(params.url, params.target == 1 ? '_blank' : '_self');
	};

	_private['mqq.device.qqVersion'] = function() {
		return '4.6.0';
	};

	_private['mqq.device.model'] = function() {
		return 'iphone';
	};

	_private['mqq.data.getUserInfo'] = function() {
		var uin = (router.getParams())['uin'] || 0;
		var sid = (router.getParams())['sid'] || '';
		return {uin: uin, sid: sid};
	};

	_private['mqq.device.systemVersion'] = function() {
		return {result: 0, data: '7.0.0'};
	};

	_private['mqq.device.getNetworkType'] = function() {
		return 4;
	}

	_private['GCApi.getReportPublicHighData'] = function(callback) {
		callback('x|unkown|7.0.0|0.0.0');
	};

	_private['GCApi.getReportPublicData'] = function(callback) {
		callback('x|x|7.0.0|android');
	};

	_private['GCApi.getUin'] = function(callback) {
		var uin = (router.getParams())['uin'] || 0;
		if (typeof(callback) === 'function') {
			callback(uin);
		}
		return uin;
	};

	_private['GCApi.getSid'] = function(callback) {
		var sid = (router.getParams())['sid'] || '';
		if (typeof(callback) === 'function') {
			callback(sid);
		}
		return sid;
	};

	_private['GCApi.setClientWebviewPull'] = function() {

	};

	_private['mqq.app.launchAppWithTokens'] = function() {
	};

	_private['QQApi.launchAppWithTokens'] = function() {

	};

	_private.installList = {};

	_private['mqq.app.isAppInstalledBatch'] = function(paramsList) {
		var data = [];
		for (var i = 0; i < paramsList.length; i++) {
			if (typeof (_private.installList[paramsList[i]]) != 'undefined') {
				data.push(_private.installList[paramsList[i]]);
			} else {
				_private.installList[paramsList[i]] = (Math.random() > 0.1) ? 0 : 1;
				data.push(_private.installList[paramsList[i]]);
			}
		}
		return data;
	};

	_private['QQApi.isAppInstalledBatch'] = function(paramsList, callback) {
		var paramsList = paramsList.split('|');
		var data = [];
		for (var i = 0; i < paramsList.length; i++) {
			if (typeof (_private.installList[paramsList[i]]) != 'undefined') {
				data.push(_private.installList[paramsList[i]]);
			} else {
				_private.installList[paramsList[i]] = (Math.random() > 0.1) ? 0 : 1;
				data.push(_private.installList[paramsList[i]]);
			}
		}
		callback(data.join('|'));
	};

	_private.updateData = {};
	_private['q_download.checkUpdate'] = function(params) {
		var params = JSON.parse(params);
		var itemList = params.packageNames;
		var data = [];
		for (var i = 0; i < itemList.length; i++) {
			if (typeof (_private.updateData[itemList[i]]) != 'undefined') {
				data.push(_private.updateData[itemList[i]]);
			} else {
				_private.updateData[itemList[i]] = {
					pkgName: itemList[i],
					newApkSize: '180',
					patchSize: '22',
					updatemethod: [0, 1, 2, 3, 4][parseInt(Math.random() * 5)],
					versioncode: 'versionCode',
					versionname: 'versionName',
					fileMd5: 'fileMd5',
					sigMd5: 'sigMd5',
					url: 'http://vip.qq.com'
				};
				data.push(_private.updateData[itemList[i]]);
			}
		}
		if (typeof (window.Downloader.updateCallbackFunc) == 'function') {
			window.Downloader.updateCallbackFunc(JSON.stringify(data));
		}

	};

	_private['q_download.doDownloadAction'] = function(params) {
		var params = JSON.parse(params);

		if (params.actionCode == 2) {//下载
			_private.state[params.appid] = {
				state: 2, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装
				pro: 2,
				appid: params.appid
			};
		} else if (params.actionCode == 3) {
			_private.state[params.appid] = {
				state: 3, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装
				pro: _private.state[params.appid] ? _private.state[params.appid]['pro'] : 0,
				appid: params.appid
			};
		} else if (params.actionCode == 5) {
			_private.state[params.appid] = {
				state: 6, // 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装
				pro: 100,
				appid: params.appid
			};
		}
	};

	_private['q_download.doGCDownloadAction'] = function() {};

	_private.state = {};
	_private['q_download.getQueryDownloadAction'] = function(params) {
		var params = JSON.parse(params);
		var data = [];
		var state, pro, appId;
		for (var i = 0; i < params.length; i++) {
			appId = params[i]['appid'];
			if (typeof(_private.state[appId]) != 'undefined') {
				data.push(_private.state[appId]);
			} else {
				state = [2, 3, 4, 5, 6, 9, 13][parseInt(Math.random() * 7)];
				if (state == 3) {
					pro = parseInt(Math.random() * 100);
				} if (state == 2) {
					pro = 2;
				} else {
					pro = 100;
				}
				_private.state[appId] = {
					state: state,// 1：初始状态，2：下载中，3：暂停，4：下载完成，6：安装完成，9：卸载安装，13：覆盖安装
					pro: pro,
					appid: appId
				};
				data.push(_private.state[appId]);
			}

			if (_private.state[appId]['state'] == 2) {
				_private.state[appId]['pro'] = _private.state[appId]['pro'] + 10;
				if (_private.state[appId]['pro'] > 99) {
					_private.state[appId]['pro'] = 100;
					_private.state[appId]['state'] = 4;
				}
			}
		}
		if (typeof(window.Downloader.callbackFunc) == 'function') {
			window.Downloader.callbackFunc(data);
		}
	};

	_private['q_download.getDownloadVersion'] = function(callback) {
		var version = 2;
		if (typeof(callback) === 'function') {
			callback(version);
		}
		return version;
	};

	_private['QQApi.getAppsVerionCodeBatch'] = function(params, callback) {
		var params = params.split('|');
		var data = [];
		for (var i = 0; i < params.length; i++) {
			data.push(6);
		}
		callback(data.join('|'));
	};

	_private['mqq.sensor.getLocation'] = function(callback) {
		callback(0, '22.540344', '113.933784');
	};

	exports._invokeByCommonAPI = function(method, paramsList, callback) {
		if (typeof(_private[method]) === 'function') {
			callback({
				result: 0,
				data: _private[method].apply(null, paramsList)
			});
		} else {
//			window.alert([
//				'调用函数：' + method,
//				'参数信息：' + JSON.stringify(paramsList),
//				'回调函数：\r\n' + callback
//			].join('\r\n'));
		}
	};
});

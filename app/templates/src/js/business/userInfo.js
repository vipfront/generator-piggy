/**
 *    user_info.js
 *    拉取用户信息的接口
 *    这里采用本地缓存的方式,目前存储使用的是localstorage和内存两个，
 *    如果支持localstorage，就使用localstorage。否则记录在内存里面
 *    只有在没有信息，或者信息过期的情况下，再重新拉取
 *
 */
define(function(require, exports, module) {
	/** @module business/userInfo */
	var $         = require('lib/zepto');
	var net       = require('util/net');
	var cacheData = require('util/cacheData');
	var router    = require('business/router');
	var common    = require('jsBridge/common');

	/**
	 *    _getBaseUserInfo
	 *    获取用户的基本信息,包括用户的uin ，昵称，等级图片url ， 头像，会员等级，超级会员信息
	 *    @param     callback      function 获取用户信息之后的回调方法
	 *    @param     update        boolean  是否强制拉取最新的数据
	 *    @return    ret           number   返回码 0 成功，其他失败
	 *    @return    data          object   返回的数据
	 *			        {    uin           number   用户uin
	 *			             nick          string   用户昵称
	 *			             figureUrl     string   头像信息
	 *			             qqVipInfo     object   用户的会员信息{vip_lev:number , vip:number ,svip:number ,year:number ,vip_logo_url:string}
	 *			             openId        暂时无用
	 *      				 playAppnum    number    用户玩的游戏的数量
	 *					}
	 *   @return     message      string   错误信息（ret 不为0的时候使用）
	 *
	 */
	function _getBaseUserInfo(  callback, update) {
	
		var cacheKey = [ router.getUserId(), 'selfinfo_get'].join('/');
		var cache    = cacheData.get(cacheKey);     //尝试从用户缓存获取，如果没有的话，再拉取

		if (cache && !update) {
			try {

				callback && callback(cache);

				return;

			} catch (e) {

			}
		}

		net.ajax({
            url: router.createUrl('/selfinfo/get', {appid: null}),
			data: {
				"appid": 0
			},
			dataType: 'json',
			success: function(json) {
				
				if (0 == json.ret) {      //拉取到用户的数据了之后，就重新写入用户数据中去
			
					//对于老版本的数据，需要进行一下转换，转换成现在需要的结构
					var returnObj = {

						"result": 0,
						"data": { 
							"uin"       : json.uin || 0, 
							"nick"      : json.nick_name || "",
							"figureUrl" : json.figureurl_qq || "",
							"qqVipInfo" : json.qq_vip_info  || {},
							"openId"    : json.openid,
							"playAppnum": json.play_appnum || 0   
						},
						"message": json.msg

					};
					
					callback && callback( returnObj );

					cacheData.set(cacheKey, returnObj);

				} else {

					callback && callback(json);          //如果失败了，错误处理交给业务来处理。直接透传

				}
			}
		});

	};


	/**
	 *    _getOpenId
	 *    根据appid来获取该应用的openid. 可以是单个，也可以是批量的
	 *    @param  param    string/array appId列表,如果只有一个，就直接传数字，如果是多个，就传入数组 eg，100732256,363,100692648,100666228,100689806,100689805
	 *    @param  callback function     回调方法 .
	 *    @param  update   boolean      是否强制拉取最新的数据
	 *    @return ret      number       是否成功返回，0成功，1不成功
	 *   @return items    array        用户的appid和openid键值对 eg : [{ "appid":"openkey" },{"appid1":"openkey1"}]
	 *    @return uin      number       用户uin
	 *    @return msg      string       返回信息
	 */
	function _getOpenId(params, callback, update) {

		//参数为空自动返回null 
		if (!params) {

			console.log("input params error");
			return null;
		}

		var appIdArr = null;      //多个id查询时候的数据
		var appId = 0;         //单个id查询时候的id
		if (params instanceof Array) {

			appidArr = params;

		} else /*if ("string" == typeof( params ))*/ {

			appidArr = [];
			appidArr.push(params);

		}/* else {

			console.log("input params error");
			return null;

		}*/

		//遍历，看是否所有的appid对映的openid都已经存在。如果没有的采取拉取
		var openIdMap = {};                //已经获取的openid的列表
		var notGetList = [];                //还没有获取的列表
		for (var i = 0; i < appidArr.length; i++) {

			var curid = appidArr[i];

			var cacheKey = [ router.getUserId(), 'openid_get' , curid ].join('/');
			var cache = cacheData.get(cacheKey);     //尝试从用户缓存获取，如果没有的话，再拉取

			if (cache) {           //如果这个cache存在的话，就把那个东西push进去即可

				openIdMap[ curid ] = cache;

			} else {

				notGetList.push(curid);          //如果已经获得了，就将该id直接从请求列表里面删除

			}
		}

		//如果没有需要单独获取到的openid，那么就直接构造返回即可
		if (notGetList.length <= 0 && !update) {

			callback && callback({

				"result": 0,
				"data": openIdMap,
				"message": ""
			});
			return;
		}

		//如果还有一个的话，就全部重新拉取。这样做的原因是，实时.
		net.ajax({
			url: router.createUrl('/common/get/openid'),
			data: {

				appid: notGetList.join(",") || 0

			},
			dataType: 'json',
			success: function(json) {
				if (0 == json.ret) {      //拉取到用户的数据了之后，就重新写入用户数据中去

					//这里是一个老的cgi，需要对原来的数据做一个结构的转换
					var temMap = {};
					for (var i = 0; i < json.items.length; i++) {

						var cur = json.items[i];
						if (cur.appid && cur.openid) {

							temMap[ cur.appid ] = cur.openid;

							//将所返回的数据保存起来
							var cacheKey = [ router.getUserId(), 'openid_get' , cur.appid].join('/');
							cacheData.set(cacheKey, cur.openid);

						}
					}

					var retObj = {

						"result": 0,
						"data": temMap,
						"message": json.msg || ""
					}

					//回调回调方法
					callback && callback(retObj);

				} else {

					callback && callback(json);          //如果失败了，错误处理交给业务来处理。直接透传

				}
			}
		});

	};

	exports.getUserInfo = _getBaseUserInfo;      //拉取用户的基本信息
	exports.getOpenId = _getOpenId;            //拉取appid对应的openid

	/**
	 * 消除红点（4.2的在线版本）
	 * @param {object} params 请求参数
	 * @param {function} callback 回调函数
	 */
	exports.setRed = function(params, callback) {
		common.getQQVersion(function(json) {
			if (json.result == 0 && json.data) {
				//只有4.2版本需要通过CGI消除红点
				if (json.data.indexOf('4.2.') == 0) {
					net.ajax({
						url: router.createUrl('/redbit/set'),
						cache: false,
						dataType: 'json',
						success: function(json) {
							if (typeof(callback) == 'function') {
								if (json && json.ret == 0) {
									callback({result: 0, message: 'ok'});
								} else {
									callback({
										result: -1,
										message: (json && json.msg) || 'error data'
									}, params);
								}
							}
						},
						error: function(jqXHR, statusText, errorText) {
							if (typeof(callback) == 'function') {
								callback({
									result: -1,
									message: errorText
								}, params);
							}
						}
					});
				}
			}
		});

	};
});

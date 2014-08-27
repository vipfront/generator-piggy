/**
*	openVip.js
*	开通会员和超级会员的封装
*	这个的主要作用是屏蔽会员和超级会员的开通和平台的耦合
*	
*	@include  qqapi.js          //必须包含最新的qqapi的基础库。当然在目前的网页里面是有这个的。
*	@include  zepto.js          //使用到里面的网络模块
*	目前，ios 调用苹果的支付接口，只支持会员超级会员两个，3 ， 6 ，12个月的开通
*	android，4.6.1之前的支持跳转页面的支付，4.6.1支持原生的sdk支付
*/

define( function( require, exports , module){
	
	var router       = require("business/router");     //router，获取参数
	var common       = require("jsBridge/common");  //获取客户端的信息 
	var dialog       = require("jsBridge/dialog");  //获取客户端的信息      
	var user         = require("business/userInfo");  //获取用户信息
	
	var g_aid        = "";                              //支付的aid，用作统计使用，每个页面有唯一的aid
	var sid          = router.getParams("sid");         //获取sid   
	var g_uin        = 0;                               //需要传入uin
	
	var openVipUrl   = 'http://vip.3g.qq.com/touch/touch_vip.jsp';
	var openSvipUrl  = 'http://vip.3g.qq.com/touch/svip_open.jsp';
	//var openVipUrl   = 'https://www.tenpay.com';
	//var openSvipUrl  = 'https://www.tenpay.com';
	var qqClient     = common.getClient();             //系统类型
	var qqVersion    = '4.2.1';                        //手Q版本，主要在android判断的时候，需要用到
	
	//自动执行方法
	(function(){
		
		common.getQQVersion( function( res ){
		
			if( 0 == res.result){        //获取成功就正常处理，否则就按照最低版本来处理
				
				qqVersion = res.data;
			
			}else{
			
				qqVersion = '4.2.1';         //最低版本
			
			}
		});
	
	})();
	
	
	/**
	*	支付接口，只有4.6.1以及以上的版本支持
	*	开通超级会员接口
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*/
	var _openAndroidSvipService = function( num , callback ){
		
		if( !g_uin ){      //这个必须有uin，所以需要先获取uin，然后再调用接口
		
			//net.getUserInfo( _openAndroidSvipService );
            net.getUserInfo(function() {
                _openAndroidSvipService(num, callback);
            });
            return;
		
		}
		
		var data={
			'offerId'      : "1450000480",
			'userId'       : g_uin || 0,
			'serviceCode'  : "CJCLUBT",
			'serviceName'  : "超级会员",
			'aid'          : g_aid,
			'openMonth'    : num || 3,
			'isCanChange'  : true
		};
		
		
		try{
            common._invokeByCommonAPI('mqq.tenpay.openService', [data, function(res){
				
				if( 0 == res.resultCode ){
				
					callback && callback( { "result":0 , "msg": "success"});

				}else if( 2 == res.resultCode ){     //用户取消，什么也不做
				
					callback && callback( { "result": 2 , "msg": "user canceled "});
					
				}else{
					
					callback && callback( { "result": res.resultCode , "msg": res.message });
				
				}
			}]);
		
		}catch(e){
			
			var url  = openVipUrl + '?sc=vip&aid=' + g_aid + '&sid=' + sid + "&m=" + num;
			common.openUrl( {"url":url} );
			
		}
	};
	
	/**
	*	_openIosSvipService
	*	ios 开通超级会员接口,不可以续费
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*/
	var _openIosSvipService = function( num , callback ){
		
		num = num || 3;
		net.getPayBill( "svip" ,num, function( json ){
			var options = { pf                  : 'openmobile_android-2001-iap-club', 
							pfkey               : 'pfkey',
							product_id          : json.product_id,
							product_type        : 2,
							pay_item            : json.pay_item,
							qq_product_id       : json.qq_product_id,
							qq_product_name     : json.product_name,
							quantity            : 1,
							is_deposit_game_coin: 0,
							app_id              : json.app_id,
							var_item            : 'appid=' + json.appid + '&product_id=' + json.product_id + '&timestamp=' + json.timestamp};

			//调用系统原生支付接口
            common._invokeByCommonAPI('mqq.pay.pay', [options, function( ret , msg ){
				
				switch (ret) {
					case 0: // 支付成功，清主人态缓存，刷新页面
						callback && callback( {"result": 0 , "msg":"success"});
						break;
					case 5: // 登录失败或失效
						//var url='/index.html?err=401&aid='+getAid();
						//window.location.href = url;
						//break;
					case 6: // 用户取消
					case 7: // 用户关闭IAP支付
					default: //alert(msg);
						callback && callback( {"result": ret , "msg": msg || ""});
				}
			}]);
		});
	};
	

	/**
	*	支付接口，只有4.6.1以及以上的版本支持
	*	开通会员接口
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*/
	var _openAndroidVipService = function( num ,callback ){
		
		if( !g_uin ){      //这个必须有uin，所以需要先获取uin，然后再调用接口
		
			//net.getUserInfo( _openAndroidVipService );
            net.getUserInfo(function() {
                _openAndroidVipService(num, callback);
            });
		
		}
		var data={
			'offerId'      : "1450000490",
			'userId'       : g_uin || 0,
			'serviceCode'  : "LTMCLUB",
			'serviceName'  : "会员",
			'aid'          : g_aid,
			'openMonth'    : num || 3,
			'isCanChange'  : true
		};
		
		try{
			common._invokeByCommonAPI('mqq.tenpay.openService', [data , function(res){
			
				if( 0 == res.resultCode ){
				
					callback && callback( { "result":0 , "msg": "success"});

				}else if( 2 == res.resultCode ){     //用户取消，什么也不做
				
					callback && callback( { "result": 2 , "msg": "user canceled "});
					
				}else{
					
					callback && callback( { "result": res.resultCode , "msg": res.message });
				
				}
				
			}]);
		}catch(e){
			
			var url  = openVipUrl + '?sc=vip&aid=' + g_aid + '&sid=' + sid + "&m=" + num;
			common.openUrl( {"url":url} );
			
		}
	};
	
	/**
	*	_openIosVipService
	*	ios开通会员接口,不可以续费
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*/
	var _openIosVipService = function( num  , callback ){
		
		num = num || 3;
		net.getPayBill( "club" ,num, function( json ){
			var options = { pf                  : 'openmobile_android-2001-iap-club', 
							pfkey               : 'pfkey',
							product_id          : json.product_id,
							product_type        : 2,
							pay_item            : json.pay_item,
							qq_product_id       : json.qq_product_id,
							qq_product_name     : json.product_name,
							quantity            : 1,
							is_deposit_game_coin: 0,
							app_id              : json.app_id,
							var_item            : 'appid=' + json.appid + '&product_id=' + json.product_id + '&timestamp=' + json.timestamp};

			
			//调用系统原生支付接口
			
			common._invokeByCommonAPI('mqq.pay.pay', [options, function( ret , msg ){
				
				switch (ret) {
					case 0: // 支付成功，清主人态缓存，刷新页面
						callback && callback({"result": 0 , "msg": "success"});
						break;
					case 5: // 登录失败或失效
						//var url='/index.html?err=401&aid='+getAid();
						//window.location.href = url;
						//break;
					case 6: // 用户取消
					case 7: // 用户关闭IAP支付
						// do nothing
					default: //alert(msg);
						callback && callback( {"result": ret , "msg": msg || ""});
				}
			}]);
		})
	};
	
	/**
	*	openVip
	*	开通会员，可以指定开通
	*	@param aid       string    必选 开通的支付的aid
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*/
	exports.openVip = function( aid,num , callback ){
		g_aid      = aid || "";
		
		num        = num || 3;
		callback   = callback || function(){ window.location.reload(); };
	
		if( "androidqq" == qqClient ){            //对于androidQQ来说，有两种 否则使用跳转页面支付
			
			if( qqVersion > "4.6.0"){ 			//4.6.1以及以后的，使用sdk的支付，
			
				_openAndroidVipService( num , callback )
			
			}else{
			
				var url  = openVipUrl + '?sc=vip&aid=' + g_aid + '&sid=' + sid + "&m=" + num;
				common.openUrl( {"url":url} );
				
			}
	
		}else if( "iphoneqq" == qqClient ){
			
			function checkVip( json ){
				if( json != null && json.ret == 0 ) {
					if( json.is_club ){
					
						dialog.show({
						
							"content": "您已经是QQ会员，不需要再次开通！"
						
						});
					
					}else{
					
						_openIosVipService( num , function( json ){
						
							callback && callback();
							
						});
					}
					
				}else{
				
					window.location.reload();
					
				}			
			};
			
			if( qqVersion <= "4.2.2"){ 			//4.2.2以及以后的，才支持使用ios支付
			
				alert("您的QQ版本过低，请先更新，再来开通");
			
			}else{
			
				net.checkVipInfo(  checkVip );
				
			}
		}
	};
	
	
	/**
	*	openSvip
	*	开通超级会员
	*	@param aid       string    必选 开通的支付的aid
	*	@param num       number    可选 开通多少个月，默认为3
	*	@param callback  function  可选 回调方法，默认为刷新当前页面
	*	
	***/
	exports.openSvip = function( aid  , num ,  callback ){
	
		g_aid      = aid || "";
		num        = num || 3;
		callback   = callback || function(){ window.location.reload(); };
		
		if( "androidqq" == qqClient ){            //对于androidQQ来说，有两种 否则使用跳转页面支付
			
			if( qqVersion > "4.6.0"){ 			//4.6.1以及以后的，使用sdk的支付，
			
				_openAndroidSvipService( num  , callback )
			
			}else{
			
				var url  = openSvipUrl + '?sc=svip&aid=' + g_aid + '&sid=' + sid + "&m=" + num;
				common.openUrl( {"url":url} );
				
			}
	
		}else if( "iphoneqq" == qqClient ){    //ios只有调用苹果的支付系统,但是有互斥逻辑
			
			function checkSVip( json ){
				if( json != null && json.ret == 0 ) {
				
					if( json.is_superclub ){
					
						dialog.show({
						
							"content": "您已经是超级会员，不需要再次开通！"
						
						});
						
					}else{
					
						_openIosSvipService( num , function( json ){
						
							callback && callback();
							
						});
					}
					
				}else{
				
					window.location.reload();
					
				}			
			};
			
			net.checkVipInfo( checkSVip );
			
		
		}
	};
	
	
	/**
	*	网络通信模块
	*	这里主要是ios在使用的时候会用到
	*	因为 1. ios的互斥逻辑，导致每次开通的时候，都必须去检查用户是否已经是会员，或者超级会员，如果已经是的，就提示用户
	*	     2. 在开通的时候，ios需要从网上拉取订阅号相关的信息
	*/
	var net = {	
		//解决跨域问题,的jsonp方式
		loadScript:function( src ){
		    var d=document.createElement("script");
				d.onerror = function(){};
				d.src     = src;
				document.head.appendChild(d);

		},
		
		//拉取用户的vip信息，用来做互斥的校验.这里使用ajax的跨域请求
		checkVipInfo : function( callback ) {
		
			window.ios_pay_get_user_info = function( json ){
				
				callback && callback( json );
				
				window.ios_pay_get_user_info = null;         //自己干掉自己
				delete window.ios_pay_get_user_info;
			}
			
			net.loadScript('http://fun.svip.qq.com/index.php?r=profile/userinfo&data=uin,is_club,is_superclub&g_tk_type=1&sid=' + sid + '&g_tk=' + _getCSRFToken()+'&callback=ios_pay_get_user_info');

		},
		
		//获取订单信息
		getPayBill:function( type , num  ,callback ){
			if( !type ){ 
				return;
			}
			num = num || 3;
			
			window.ios_pay_get_bill_info = function( json ){
				
				callback && callback( json );
				
				window.ios_pay_get_bill_info = null;         //自己干掉自己
				delete window.ios_pay_get_bill_info;
			}
			
			var curTime = Date.now()/ 1000;
			var qstr = 'product_name=' + type + '&pay_item=' + num + '&timestamp=' + curTime;

			net.loadScript('http://fun.svip.qq.com/index.php?r=IOSPay/pay&' + qstr + '&g_tk_type=1&sid='+ sid +'&g_tk=' + _getCSRFToken() + '&callback=ios_pay_get_bill_info');

		},
		//获取用户的uin信息，还有会员信息。这个和checkVipInfo的信息基本一样。而且是由游戏中心维护的cgi，可以考虑后续切换回来
		getUserInfo:function( callback ){
			
			user.getUserInfo( function( json ){
				
				if( 0 == json.result ){
				
					json.data = json.data || {};
					
					g_uin     = json.data.uin || 0;
					
					callback && callback();
				
				}else{
				
					dialog.show({
						
						"content": "当前操作的用户过多，请稍候重试"
					
					});
				
				}
			});
		}
	};
	
	//获取pfkey
	var  _getMD5 = function(str) {
			var hexcase = 0;
			var b64pad = '';
			var chrsz = 8;
			var mode = 32;
			function hex_md5(s) {
				return binl2hex(core_md5(str2binl(s), s.length * chrsz));
			}
			function b64_md5(s) {
				return binl2b64(core_md5(str2binl(s), s.length * chrsz));
			}
			function str_md5(s) {
				return binl2str(core_md5(str2binl(s), s.length * chrsz));
			}
			function hex_hmac_md5(key, data) {
				return binl2hex(core_hmac_md5(key, data));
			}
			function b64_hmac_md5(key, data) {
				return binl2b64(core_hmac_md5(key, data));
			}
			function str_hmac_md5(key, data) {
				return binl2str(core_hmac_md5(key, data));
			}
			function core_md5(x, len) {
				x[len >> 5] |= 0x80 << ((len) % 32);
				x[(((len + 64) >>> 9) << 4) + 14] = len;
				var a = 1732584193;
				var b = -271733879;
				var c = -1732584194;
				var d = 271733878;
				for (var i = 0; i < x.length; i += 16) {
					var olda = a;
					var oldb = b;
					var oldc = c;
					var oldd = d;
					a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
					d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
					c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
					b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
					a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
					d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
					c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
					b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
					a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
					d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
					c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
					b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
					a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
					d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
					c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
					b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
					a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
					d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
					c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
					b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
					a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
					d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
					c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
					b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
					a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
					d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
					c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
					b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
					a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
					d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
					c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
					b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
					a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
					d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
					c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
					b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
					a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
					d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
					c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
					b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
					a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
					d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
					c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
					b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
					a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
					d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
					c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
					b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
					a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
					d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
					c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
					b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
					a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
					d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
					c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
					b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
					a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
					d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
					c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
					b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
					a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
					d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
					c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
					b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
					a = safe_add(a, olda);
					b = safe_add(b, oldb);
					c = safe_add(c, oldc);
					d = safe_add(d, oldd);
				}
				if (mode == 16) {
					return Array(b, c);
				} else {
					return Array(a, b, c, d);
				}
			}
			function md5_cmn(q, a, b, x, s, t) {
				return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
			}
			function md5_ff(a, b, c, d, x, s, t) {
				return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
			}
			function md5_gg(a, b, c, d, x, s, t) {
				return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
			}
			function md5_hh(a, b, c, d, x, s, t) {
				return md5_cmn(b^c^d, a, b, x, s, t);
			}
			function md5_ii(a, b, c, d, x, s, t) {
				return md5_cmn(c^(b | (~d)), a, b, x, s, t);
			}
			function core_hmac_md5(key, data) {
				var bkey = str2binl(key);
				if (bkey.length > 16)
					bkey = core_md5(bkey, key.length * chrsz);
				var ipad = Array(16),
						opad = Array(16);
				for (var i = 0; i < 16; i++) {
					ipad[i] = bkey[i]^0x36363636;
					opad[i] = bkey[i]^0x5C5C5C5C;
				}
				var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
				return core_md5(opad.concat(hash), 512 + 128);
			}
			function safe_add(x, y) {
				var lsw = (x & 0xFFFF) + (y & 0xFFFF);
				var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
				return (msw << 16) | (lsw & 0xFFFF);
			}
			function bit_rol(num, cnt) {
				return (num << cnt) | (num >>> (32 - cnt));
			}
			function str2binl(str) {
				var bin = Array();
				var mask = (1 << chrsz) - 1;
				for (var i = 0; i < str.length * chrsz; i += chrsz)
					bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
				return bin;
			}
			function binl2str(bin) {
				var str = "";
				var mask = (1 << chrsz) - 1;
				for (var i = 0; i < bin.length * 32; i += chrsz)
					str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
				return str;
			}
			function binl2hex(binarray) {
				var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
				var str = "";
				for (var i = 0; i < binarray.length * 4; i++) {
					str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
							hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
				}
				return str;
			}
			function binl2b64(binarray) {
				var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
				var str = "";
				for (var i = 0; i < binarray.length * 4; i += 3) {
					var triplet = (((binarray[i >> 2] >> 8 * (i % 4)) & 0xFF) << 16) | (((binarray[i + 1 >> 2] >> 8 * ((i + 1) % 4)) & 0xFF) << 8) | ((binarray[i
							+2 >> 2] >> 8 * ((i + 2) % 4)) & 0xFF);
					for (var j = 0; j < 4; j++) {
						if (i * 8 + j * 6 > binarray.length * 32)
							str += b64pad;
						else
							str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
					}
				}
				return str;
			}
			return hex_md5(str);
		};
		
		var CSRF_TOKEN_KEY  = 'tencentQQVIP123443safde&!%^%1282';
		var CSRF_TOKEN_SALT = 5381;
		
		var _getCSRFToken = function(param) {
			param = param || {};
			var salt   = param.salt || CSRF_TOKEN_SALT;
			var md5key = param.md5key || CSRF_TOKEN_KEY;
			var skey   = param.skey || sid || '';
			var hash   = [],ASCIICode;
			hash.push((salt << 5));
			for (var i = 0, len = skey.length; i < len; ++i) {
				ASCIICode = skey.charAt(i).charCodeAt(0);
				hash.push((salt << 5) + ASCIICode);
				salt = ASCIICode;
			}
			return _getMD5(hash.join('') + md5key);
		}

	

});

define(function(require, exports, module){
	var common = require("jsBridge/common");
	//预加载icon
	var c_img = new Image();
	
	var _NetObj = (function(){
		var _public = {};
		var _private = {};
		/**
		 * 获取网络状况并执行回调 netType = ['none', 'wifi', '2g', '3g', 'unkown']; 自定义异常返回exep,还有cmnet情况
		 * @param fn 当获取到网络状况后处理网络状况的回调函数
		 */
		_public.getNetworkStatus = function(fn){
			common.getNetworkType(function(res){
				if(res.result == 0){
					fn(res.data);
				}else{
					//异常情况
					fn("exep");
				}
			});
	
		};
		
		_public.showTips = _private.showTips = function(title){
			var timeInter = 2000;	//配置tips展示的时间
			$(".wrapper .gc-tips .tips-cont .net-tips-word").html(title);
			$(".wrapper .gc-tips").show();
			if(typeof timerForNet == "undefined"){
				timerForNet = setTimeout(function(){
					//隐藏tips
					$(".wrapper .gc-tips").hide();
				},timeInter);
			}else{
				clearTimeout(timerForNet);
				timerForNet = setTimeout(function(){
					//隐藏tips
					$(".wrapper .gc-tips").hide();
				},timeInter);
			}
			
		};
		_private.configNoWifi = function(s){
			var r_res = false;	//默认是认为当前为wifi情况
			if( typeof c_img.src == "undefined" || c_img.src.length == 0 || c_img.src.length == "" ){
				c_img.src = "../img/icon-s.png";
			}
			var title = "";
			switch(s){
				case "none" : 	//若当前没有网络，优先级最高，最先提示。
					title = "当前网络不可用，请检查您的网络设置";
					_private.showTips(title);
					r_res = true;
					break;
				case "exep" : //对于异常暂时无提示
					break;
				case "unkown" : //无法获取到网络状况时不做提示
					break;
				case "wifi" : 	//若当前是wifi，不作提示
					break;
				case "2g" : 
					title = "当前是非wifi网络，请注意流量消耗";
					_private.showTips(title);
					r_res = true;
					break;
				case "3g" : 
					title = "当前是非wifi网络，请注意流量消耗";
					_private.showTips(title);
					r_res = true;
					break;
				case "cmnet" :	//兼容android 4.2.1 API的返回值
					title = "当前是非wifi网络，请注意流量消耗";
					_private.showTips(title);
					r_res = true;
					break;
				default :	//以后版本若有4G的情况或者新增了老版本没有的string类型
					break;
			
			}
			return r_res;
		};
		_private.configNoNet = function(s){
			var r_res = false;	//默认是有网络的
			if( typeof c_img.src == "undefined" || c_img.src.length == 0 || c_img.src.length == "" ){
				c_img.src = "../img/icon-s.png";
			}
			var title = "";
			switch(s){
				case "none" : 	//若当前没有网络，优先级最高，最先提示。
					title = "当前网络不可用，请检查您的网络设置";
					_private.showTips(title);
					r_res = true;
					break;
				default :
					break;
			}
			return r_res;
		};
		
		_public.showTipsAsNetwork = function(netType){
			if(typeof netType == "function"){
				_public.getNetworkStatus(netType);
			}
			switch(netType){
				case "weakNet":
					_public.getNetworkStatus(_private.configNoWifi);
					break;
				case "noNet":
					_public.getNetworkStatus(_private.configNoNet);
					break;
				default :
					break;
			}
		};
		/**
		 * 判断当前是否有网络
		 */
		_public.hasNetwork = function(callBack){
			_public.getNetworkStatus(function(s){
				switch(s){
				case "none" : 	//若当前没有网络，优先级最高，最先提示。
					callBack(false);
					break;
				case "exep" : //对于异常情况，无法判断网络状况，保持原有逻辑
					callBack(true);
					break;
				case "unkown" : //无法获取到网络状况时不做提示
					callBack(false);
					break;
				default :
					callBack(true);
					break;
				}
			});
		};
		/**
		 * 判断当前是否为wifi,并做回调处理
		 * r_res 标记有wifi还是无wifi情况下回调callBack,true表示不是wifi,false表示是wifi
		 */
		_public.isNoWifiNet = function(callBack){
			common.getNetworkType(function(res){
				var r_res = "";
				if(res.result == 0){
					r_res = _private.configNoWifi(res.data);
				}else{
					//异常情况
					r_res = _private.configNoWifi("exep");
				}
				callBack(r_res);
			});
			
		};
		return _public;
	})();
	//每个页面引入该JS文件后自动执行侦探有无网络
	//_NetObj.showTipsAsNetwork("noNet");
	
	exports.NetObj = _NetObj;
});


		
		

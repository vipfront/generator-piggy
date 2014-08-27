/**
 * 上报模块
 */
define(function(require, exports, module){

	var $ = require('lib/zepto');
	var bridge = require('jsBridge/common');

	/**
	 * @exports business/report
	 */
	var env = module.exports = {};
	var platform;
	/*
	 * 获取平台
	 */
	if(bridge.getClient() == 'iphoneqq'){
		platform = 'ios';
	}
	else{
		platform = 'android';
	}
	env.platform = platform;
	
	/*
	 * 获取平台OS版本号
	 */
	bridge.getSystemVersion(function(obj){
		if(obj.result == 0){
			env.osVersion = obj.data;
		}
	});
	
	/*
	 * 获取手Q版本
	 */
	bridge.getQQVersion(function(obj){
		if(obj.result == 0){
			env.qqVersion = obj.data;
		}
	});
	
	/* 
	 * 获取设备类型
	 */
	bridge.getDeviceModel(function(obj){
		if(obj.result == 0){
			env.device = obj.data;
		}
	});
	
	/*
	 * 获取网络类型
	 */
	bridge.getNetworkType(function(obj){
		if(obj.result == 0){
			env.netType = obj.data;
		}
	});
	
	/*
	 * 获取是否在线版或离线版
	 */
	if(
		platform == 'ios' && window.location.href.indexOf('/cdn/ios/') != -1 ||
		platform == 'android' && window.location.href.indexOf('/cdn/android/index/') != -1
	){
		env.isOnline = 1;
	}
	else{
		env.isOnline = 0;
	}
	
	env.resolution = (function() {
        //var dpr = window.devicePixelRatio || 1;
        //return [dpr * screen.width, dpr * screen.height].join('*');
        return [screen.width, screen.height].join('*');
    })();
	
	//展示一个tips
	var  tipsElem = null;
	var  taped    = false;
	var  startLeft= 0;
	var  startTop = 0;
	
	function createTips( name ){
	
		if( !tipsElem ){
			
			tipsElem = document.createElement("div");
			tipsElem.style.position   = "fixed";
			tipsElem.style.background = "rgb(109, 101, 101)";
			tipsElem.style.top        = "90%";
			tipsElem.style.left       = "50%";
			tipsElem.style.marginLeft = "-54px"; 
			tipsElem.style.zIndex     = "999";
			tipsElem.style.color      = "white";
			tipsElem.style.padding    = "10px";
			tipsElem.style.whiteSpace = "nowrap";
			
			tipsElem.innerHTML        = name;
			document.body.appendChild( tipsElem );
			
			tipsElem.addEventListener("touchstart" , function( evt ){
				taped      = true;
				startLeft  = evt.targetTouches[0].pageX;
				startTop   = evt.targetTouches[0].pageY;
			});
			
			tipsElem.addEventListener("touchmove" , function( evt ){
				if( taped ){
					
					var disX     = evt.targetTouches[0].pageX - startLeft;
					var disY     = evt.targetTouches[0].pageY - startTop;
					
					var scrollTop= $( document.body ).scrollTop();
					var position = $( tipsElem ).position();
					var posLeft  = position.left + disX;
					var posTop   = position.top  + disY - scrollTop;
					$( tipsElem ).offset( { "left": posLeft , "top":posTop});
					
					startLeft    = evt.targetTouches[0].pageX;
					startTop     = evt.targetTouches[0].pageY;
				}
				
				evt.preventDefault();
			});
			
			tipsElem.addEventListener("touchend" , function( evt ){
				
				taped     = false;
				startLeft= 0;
				startTop = 0;
				
			});
			
			tipsElem.addEventListener("click" , function( evt ){
                if(tipsElem) {
                    document.body.removeChild( tipsElem );
                    tipsElem=null;
                }
			});
			setTimeout(function(){
                if(tipsElem) {
                    document.body.removeChild( tipsElem );
                    tipsElem=null;
                }
			},3000)
		}
		
	}
	//根据用户当前的环境不同，给一个提示
	if (window.location.host.indexOf('gamecentertest.cs0309.3g.qq.com') != -1) {
		//开发测试环境
		createTips("开发测试环境");
	} else if (window.location.host.indexOf('gconlytest.cs0309.3g.qq.com') != -1) {
		//专业测试环境
		createTips("专业测试环境");
	} else if (window.location.host.indexOf('gcpre.cs0309.3g.qq.com') != -1) {
		//预发布环境
		createTips("预发布环境");
	} 
});

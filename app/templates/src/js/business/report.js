/**
 * 上报模块
 */
define(function(require, exports, module){

	var _private = {};
	var $ = require('lib/zepto');
	var uri = require('util/uri');
	var env = require('business/environment');
	var router = require('business/router');
	var cacheData = require('util/cacheData');
    var net = require('util/net');

	/**
	 * @exports business/report
	 */
	var ns = module.exports = {};
	
	
	/**
	 * 收集数据并上报
	 * @param {object} params 统计参数，具体详情参照游戏中心数据上报id表
	 * @param {number} params.operMoudle 操作模块，例如页面的Tab，例如：1、精品游戏，2、游戏详情，5、礼包活动
	 * @param {number} params.operId 操作id
	 * @param {number} params.moduleType 模块类型，页面Tab里面的子模块，例如精品游戏里面的：101、banner，102、公告，103、新游戏推荐
	 * @param {number} [params.operType] 操作类型，例如：1、下载，2、安装
	 * @param {number} [params.locId] 位置Id，页面Tab里面的子模块的子区域，例如精品游戏里面的新游戏推荐：1、第一个游戏。2、第二个游戏
	 * @param {number} [params.objId] 对象Id，例如BannerId，消息Id等
	 * @param {number} [params.appId] appId
	 */
	ns.collect = function(params){
		var pageParams = uri.parseQueryString(window.location.search)
	
		var data = $.extend({
			sq_ver : env.qqVersion || '',
			gamecenter_ver : seajs.pageVersion || '',
			gamecenter_ver_type : env.isOnline ? 1 : 2,
			device_type : env.device || '',
			net_type : env.netType || '',
			resolution : env.resolution || '',
			gamecenter_src : pageParams.ADTAG || 1,
			PVSRC : pageParams.PVSRC, //增加上报内部页面跳转源标志
			ret_id : 1
		}, {
			oper_module : params.operModule || '',
			oper_id : params.operId || '',
			module_type: params.moduleType || '',
			oper_type: params.operType || '',
			loc_id: params.locId || '',
			obj_id: params.objId,
			state_id: params.stateId || '',
			logic_id: params.logicId || ''
		});
		if(params.app_list){
			data.app_list=params.app_list;
		}
		var urlParams = {
            appId: null,
			osv : env.osVersion || '',
			appid : params.appId || ''
		};
		setTimeout(function() {
			//需要sid获取后才能进行上报，所以放到ready队列里
			router.ready(function(){
				_private.post(router.createUrl('/report/pg_act', urlParams), JSON.stringify(data), function() {});
			});
		}, 0);
	};

	_private.post=function(url,param,callback){

		var xmlHttp = new XMLHttpRequest();

		xmlHttp.open("POST",url,true);
		xmlHttp.withCredentials = true;
		xmlHttp.setRequestHeader("Content-Type", "multipart/form-data");
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState == 4){
				if(xmlHttp.status == 200){
					var json;
					try{
						json=JSON.parse(xmlHttp.responseText)
					}catch(e){
						json={ret:999,msg:"wrong json"};
					}
					callback(json);
				}
			}
		};
		xmlHttp.send(param||null);
	};
	
	/**
	*  reportSpeed
	*  测速上报
	*  指定上报的ip和id，时间点
	*  @param conf object {
	* 		timePoints : []  独立上报时间点数组
	*		buzId  : number  一级 业务id
	*		siteId : number  二级 网站id
	*		pageId : number  三级 页面id
	*		num    : number  有多少个上报点，如果没有达到这个数目的话，就不需要上报了，另外会单独上报一个错误码。
	*		delay  : number  延时上报时间,单位秒
	*	}
	*	demo: report.reportSpeed( {
	* 		timePoints : [1400053875264, 1400053879999, 1400053880415, ..]
	*		buzId  : 169,
	*	    siteId : 2080,
	*       pageId : 1,
	*		num    : 5,
	*       delay  : 10
	*	})
	*/
	ns.reportSpeed = function( conf, noDelay ){
			if( !conf  || !conf.buzId || !conf.siteId || !conf.pageId ){      
				
				console.log("input param error")
				return;

			}
			var delay      = conf.delay*1 || 5;
			var points     =  conf.timePoints || window._timePoints || [];
			var _startTime =  points[0],_arr = [];
			var speedUrl   =  [];
			var _config    =  conf||{};
			var num        =  conf.num || 0;
			
            function _report() {
                for(var i = 1 ; i < num; i++){
                    var _t = i;
                    var _item = points[i] || Date.now();
                    _item && speedUrl.push( _t + "=" + ( _item - _startTime));
                }

                if(mqq.support('mqq.data.pbReport')) {
                    speedUrl.unshift("flag1="+ _config.buzId + "&flag2=" + _config.siteId +"&flag3=" + _config.pageId);
                    // 需要带上ua
                    //speedUrl.push("ua=" + encodeURIComponent(navigator.userAgent));
                    mqq.data.pbReport(102, speedUrl.join("&"));
                } else {
                    // 不支持的版本还使用原始方法上报
                    speedUrl.unshift("http://isdspeed.qq.com/cgi-bin/r.cgi?flag1="+ _config.buzId + "&flag2=" + _config.siteId +"&flag3=" + _config.pageId);
                
                    var rpt = new Image();
                    rpt.src = speedUrl.join("&");
                }
            }
			noDelay ? _report() : setTimeout( _report, delay * 1000 );	
	};
	
	/*
	 * 上报已安装游戏
	 * @param sid 用户sid
	 * @param num 已安装数量
	 */
	ns.reportInstalledGame = function(sid, installedList, newList, uninstallList){
		if(!sid){
			return;
		}
		var num=installedList.length||0;
		//每天只报一次
		var cacheKey = [router.getUserId(sid), 'installed', 'report_date'].join('/');
		var reportDate = cacheData.get(cacheKey);
		var today = new Date().getDate();
		var newApp = [], installedApp = [], uninstallApp = [], uninstallSub=[];
		var data = {
			operId : 19001,
			operModule : 19,
			objId : num
		}
		if(reportDate && reportDate == today){
			return;
		}
		cacheData.set(cacheKey, today);
		if(newList&&uninstallList){
			$.each(newList,function(i,item){
				newApp.push(item.appId);
			})
			$.each(installedList,function(i,item){
				installedApp.push(item.appId);
			})
			$.each(uninstallList,function(i,item){
				uninstallSub=[];
				$.each(item,function(j,jtem){
					uninstallSub.push(jtem.appId);
				});
				uninstallApp.push('uninstall'+i+':'+uninstallSub.join(','));
			})
			data.app_list=['new:'+newApp.join(','),'installed:'+installedApp.join(','),uninstallApp.join(';')].join(";")
		}
		ns.collect(data);
	}
	
	/**
	 * 收集数据并上报(主要用于成就上报)
	 * @param {object} params 统计参数
	 * uin	Number	用于QQ（从Sid获取）
	 * game_appid	String	游戏appid
	 * got_mission_point	Number	用户uin在此appid下已获得的(mission_status=4)成就点
		total_mission_point	Number	此appid下成就总点数
		fin_mission_cnt	Number	已完成未领取(mission_status=3)的成就个数
		award_mission_cnt	Number	已完成已领取(mission_status=4)的成就个数
		total_mission_cnt	Number	此appid下成就总个数
		finish_list	String	已经完成的成就mission_id列表 以_分隔
		award_list	String	已经领取的成就mission_id列表 以_分隔
		not_finish_list	String	还没完成的成就mission_id列表 以_分隔
	 */
	ns.reportMission = function(params){
		var pageParams = uri.parseQueryString(window.location.search)
	
		var data = $.extend({
			sq_ver : env.qqVersion || '',
			gamecenter_ver : seajs.pageVersion || '',
			gamecenter_ver_type : env.isOnline ? 1 : 2,
			device_type : env.device || '',
			net_type : env.netType || '',
			resolution : env.resolution || '',
			gamecenter_src : pageParams.ADTAG || 1,
			PVSRC : pageParams.PVSRC, //增加上报内部页面跳转源标志
			ret_id : 1
		}, {
			uin : params.uin || 0,
			tt : params.tt || 1,
			game_appid : params.appId || '',
			got_mission_point : params.gotMissionPoint || 0,
			total_mission_point: params.totalMissionPoint || 0,
			fin_mission_cnt: params.finishMissionCount || 0,
			award_mission_cnt: params.awardMissionCount || 0,
			total_mission_cnt: params.totalMissionCount || 0,
			finish_list: params.finishList || '',
			award_list: params.awardList || '',
			not_finish_list: params.notFinishList || '',
			data_source: 1 //数据来源，1 访问游戏中心触发上报，2 玩游戏触发的上报
		});
		
		var urlParams = {
			osv : env.osVersion || '',
			appid : params.appId || '',
			uin: params.uin || ''
		};

		setTimeout(function() {
			//需要sid获取后才能进行上报，所以放到ready队列里
			router.ready(function(){
				_private.post(router.createUrl('/report/mission', urlParams), JSON.stringify(data), function() {});
			});
		}, 0);
	};
	
	
	ns.reportForWhiteList = function(id){
		var startTime = router.getParams('startTime');
		
		if(!startTime){
			return;
		}
		
		startTime = parseInt(startTime, 10);
		router.ready(function(){
			_private.reportForWhiteList(id, startTime);
		});
	};

    /**
     * 上报TDW
     *
     * dcid：罗盘报表ID
     * data：上报的数据，键和罗盘表字段一致
     */
    ns.reportTDW = function(dcid, data, params) {
		net.ajax({
            url: router.createUrl('/cgi-bin/gc_dc_report_fcgi'),
			data: {
                module: 'gc_report',
                method: 'report',
                param: $.extend({
                    dcId: dcid,
                    data: data
                }, params || {})
            },
			plugins: {'business/mergeRequest': true},
			cache: false,
			dataType: 'json',
			success : function(){},
			error:function(){}
		});
    };
	
	_private.reportForWhiteList = function(id, startTime){
		var sid = router.getParams('sid');
		var times = [];
		var points = window._timePoints;
		var item;
		
		for(var i = 0, len = points.length; i < len; i++){
			item = points[i] - startTime;
			times.push(item);
		}
		
		
		var domain = 'gamecenter.qq.com';
		if (window.location.hostname.split('.').slice(-3).join('.') == '3g.qq.com') {
			domain = window.location.host;
		}
		var url = 'http://'+domain+'/report/tm_cost?';
		
		var params = {
			sid : sid,
			id : id,
			time : times.join(',')
		};
		params = $.param(params);
		
		url += params;
		sendImg(url);
	};
	
	function sendImg(url){
		var img = new Image();
		img.onload = img.onerror = function(){
			img = null;
		}
		img.src = url;
	}
});

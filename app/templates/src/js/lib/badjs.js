/**
 * @author herbertliu
 * @date 2013-02-25 version 0.2
 * @description badjs上报
 * @param msg {String} 上报错误信息
 * @param url {String} 该上报信息所属的文件路径
 * @param line {Number} 上报信息所属的文件行号，没有为0
 * @param smid {Number} 上报对应的monitor id,如果smid ===0 ,则只统计badjs,不上报monitor;如果没有该参数，则上报通用monitor id;如果smid === -1，window.onerror专用，会增加Script Error字段头
 * @param level {Number} 上报对应的级别 debug（调试日志）：1 ; info（流水日志）：2 ; error（错误日志）：4（默认值） ; fail（致命错误日志）：8
 * @example Badjs.init(bid,mid,min) 初始化badjs一些参数,mid,默认的业务上报Monitor id,min 是否上报浏览器简化信息;或者Badjs.init(bid,{'1' : 0,'2' : 0,'4' : 0, '8' : 0},min)
 * @example Badjs.check(o,mid)  检查页面是否存在某些文件辅助方法
 * @example Badjs.info(type)  获取badjs上报的头信息字符串，其中type为类型，不同的类型上报采用不同的字符串
 * @example Badjs(msg,url,line,smid,level,min)  badjs上报，上报字符串，地址，行号，Monitor属性id(可为空，即不报Monitor)，上报级别;min,是否上报简略信息
 * @example Badjs.report(retry,total,src,name,loaded)  文件加载失败时候，辅助上报方法
*/

(function(){
	console.log(this);
	var global = this || window,$ = global.$ || {};
	$.badjs = $.Badjs = global.Badjs = global.badjs = (function(){
		var config = {//全局配置文件
			bid : 102,
			minitor : {
				'1' : 0,
				'2' : 0,
				'4' : 0,
				'8' : 0
			},
			min : false //是否上报浏览器简化信息
		}
		var levels = {'debug':1,'info':2,'error':4,'fail':8}//level配置
		var _toString = Object.prototype.toString;
		var badjs = function(msg,url,line,smid,level,min){//min,是否上报简略信息
			var bid =  badjs._bid || config.bid;//全局bid获取
			
			
			//获取level的值
			if(_toString.call(level) === '[object String]'){
				level = levels[level] || 4;
			}
			
			level = _toString.call(level) === '[object Number]' && level || 4;//默认值	
			
			//获取mid的值
			var mid = config.minitor[level] || badjs._mid;//获取Monitor id
			
			if (smid > 0 || smid === 0){
				mid = smid;
			}else if(smid === -1){//window onerror事件处理，增加Script Error前缀
				msg = 'Script Error:' + msg;
			}
			
			if(!badjs.binfo){
				var _browser;
				if( _browser = (global['$'] && global['$']['browser'])){
					if(_browser.info){//Simple兼容
						badjs.binfo = _browser.info;
					}else{//Jquery兼容
						for(var i in _browser){
							if(_browser[i] && i != 'version'){
								badjs.binfo = {'type':i,'version':_browser.version};
								break;
							}
						}
					}
				}else{
					badjs.binfo = {};
				}				
				var _navigator = window.navigator;
				badjs.binfo.userAgent = _navigator.userAgent;
				badjs.binfo.platform = _navigator.platform;				
				badjs.binfo.appCodeName =  _navigator.appCodeName;
				badjs.binfo.appName =  _navigator.appName;
				badjs.binfo.appVersion =  _navigator.appVersion;
			}
			
			var _min = min || config['min'],_binfo = badjs.binfo;
			var _info = _binfo && ('|_|browser:[' + (_min && _binfo['type']?('type:' + _binfo['type'] + ',ver:' + _binfo['version']) :'agent:'+  _binfo.userAgent +',plat:'+  _binfo.platform +',appcode:'+  _binfo.appCodeName +',appname:'+  _binfo.appName +',appversion:'+  _binfo.appVersion) +']') || '';
			//上报
			var img = new Image();
			img.src = 'http://badjs.qq.com/cgi-bin/js_report?level='+ level +'&bid=' + bid + (mid?'&mid='+mid:'') + '&msg='+ encodeURIComponent(msg) +'|_|'+encodeURIComponent(url)+'|_|' + line + _info +'&r='+ Math.random();
			img = null;
		}
		
		var a = [];
		//我还是不不知道非0和-1的mid有什么作用
		badjs.init = function(bid,arg0,min){
			if(typeof(bid) == 'undefined'){
				throw "初始化Badjs需要bid参数，否则会将错误报到公共Badjs处";
				return;
			}
			badjs._bid = bid;
			if(_toString.call(arg0) === '[object Object]'){
				for(var i in config.minitor){
					if(arg0[i]){
						config.minitor[i] = arg0[i];//复制
					}
				}
			}else{
				badjs._mid = arg0;
			}
			badjs._min = min;//浏览器简化信息配置
		}
		
		//检查页面对象
		badjs.check = function(o,mid){
			for (var k in o){
				if(!global[k]){
					badjs('File Load Error:'+k,o[k],0,mid,8);
				}	
			}
		}
		
		badjs.report = function(retry,total,src,name,loaded){
			if(loaded || window[name]){
				if(retry > 0)Badjs('Log Info:File Load Retry Success:'+name + ' retry is' + retry,src,0,241994,1);//重试之后成功了上报一下
			}else{
				if(retry == total) Badjs('File Load Error:'+name + ' retry is' + retry ,src,0,196584,8);//加载失败
			}
		}
		//ec为0表示成功
		badjs.title = function(type,ec){
			var str = '';
			switch(type){
				case 'file'://文件加载
					return ec?'File Load Error':'File Load Success';//文件加载成功和失败
				case 'cgi'://cgi请求返回信息
					switch(ec){//ec表示CGI返回ec值
						case 0:
							str = 'CGI Load Success';
							break;
						case 1://无登陆态
							str = 'CGI NoLogin Error';
							break;
						case 4:
							str = 'CGI BaseKey Error';
							break;
					}
					return str + '!Ec:'  + (ec || '');
				case 'http'://http请求					
					switch(ec){//ec表示http返回值的status
						case -1://表示返回包体内容为空,自定义EC值
							str = 'Http Empty Error';
							break;
						case 200://正常返回
							str = 'HTTP Load Success';
							break;
						case 404://404
							str = 'HTTP Page Does Not Exist';
							break;
						case 500://500
							str = 'HTTP Server Error';
							break;
						default://默认
							str = 'Http Info';
							break;
					}
					return str + '!Status:' + (ec || '');
			}
		}
		var arr = [];
		global['onerror'] = function(){
			//TODO:兼容win7 下ie10第四个参数为列
			arr.splice.apply(arguments,[3,0,-1,null]);
			badjs.apply(this,arguments);//增加onerror badjs 特殊处理
		};
		return badjs;
	})();

	if(global.seajs) {
		define(function() {
			module.exports = global.badjs;
		});
	}
}).call(this);
/**
 * 本地存储封装
 */
define(function(require, exports, module){

	var storage = module.exports = {};
	
	/**
	 * 获取本地缓存
	 * @param {String} key 缓存名称 
	 */
	storage.get = function(key){
		var str = localStorage.getItem(key);
		var item;
		
		try{	
			item = JSON.parse(str);
		}catch(e){
			item = str;
		}
		
		return item;
	};
	
	/**
	 * 获取本地缓存
	 * @param {String} key 缓存名称 
	 * @param {Mixed} val 缓存值 
	 */
	storage.set = function(key, val){
		var str = val;
		if(typeof val != "string"&&typeof val != "number"){
			str = JSON.stringify(val);
		}
		localStorage.setItem(key, str);
		return true;
	};
	
	/**
	 * 删除某项缓存
	 * @param {String} key 缓存名称
	 */
	storage.remove = function(key){
		localStorage.removeItem(key);
	};
	
	/*
	 * 兼容不支持localStorage的情况
	 */
	if( ! window.localStorage){
		storage.get 	= function(){return false;};
		storage.set 	= function(){return false;};
		storage.remove 	= function(){return false;};
	}
});
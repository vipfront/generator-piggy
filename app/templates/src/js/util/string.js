/**
 * Created with JetBrains PhpStorm.
 * User: layenlin
 * Date: 14-3-20
 * Time: 下午2:04
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {

	exports.encodeHTML = function(str) {
		if(typeof str == 'string'){
			var ar = ['&', '&amp;', '<', '&lt;', '>', '&gt;', '"', '&quot;', '\\s', '&nbsp;'];
			for (var i = 0; i < ar.length; i += 2){
				str = str.replace(new RegExp(ar[i], 'g'), ar[1 + i]);
			}
			return str;
		}
		return str;
	}

	/**
	 * 截取最大长度字符串(按字节处理)
	 * 超过则用spchart替换，默认为...
	 * 
	 * @method splitMaxLen
	 * @author fefeding
	 * @param {String} str 待处理的字符串
	 * @param {Number} len 截取的最大长度
	 * @param {String} spchar 多余部分替换的字符串，默认为...
	 * @return {String} 处理后的字符串
	 */
	exports.splitMaxLen = function(str,len,spchar) {		
		if(str && len) {
			var blen = 0;
			var charindex = 0;
			for(;charindex < str.length; charindex++) {
				var c = str.charCodeAt(charindex);
				if(c > 299) blen += 2;
				else blen ++;
				if(blen >= len) {
					//如果超过，则减去一个字符。
					if(blen > len) charindex--;
					break;
				}
			}
			if(str.length > charindex + 1) {
				str = str.substring(0,charindex) + (spchar || '..')
			}
		}
		return str;
	}

	/**
	 * 格式化时间
	 * yy 表示年，MM表示月，dd表示天，HH表示时，mm表示分，ss表示秒
	 */
	exports.formatDate = function(date, format) {
	    date = date || new Date();
	    format = format || 'yyyy-MM-dd HH:mm:ss';
	    var result = format.replace('yyyy', date.getFullYear().toString())
	    .replace('yy', date.getFullYear().toString().substring(2,4))
	    .replace('MM', (date.getMonth()< 9?'0':'') + (date.getMonth() + 1).toString())
	    .replace('dd', (date.getDate()< 10?'0':'')+date.getDate().toString())
	    .replace('HH', (date.getHours() < 10 ? '0' : '') + date.getHours().toString())
	    .replace('mm', (date.getMinutes() < 10 ? '0' : '') + date.getMinutes().toString())
	    .replace('ss', (date.getSeconds() < 10 ? '0' : '') + date.getSeconds().toString());

	    return result;
	}
});
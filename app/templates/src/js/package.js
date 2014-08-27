/**
 * 这个文件是用在src目录下占位的
 * 没有define调用，因此不会被transport
 * 构建时会在release目录下生成一个打包好的package.js文件
 */
document.write('<script src="../../js/lib/sea.js?__inline=true"></script>');
document.write('<script src="../../js/lib/zepto.js?__inline=true"></script>');
document.write('<script src="../../js/lib/fastclick.js?__inline=true"></script>');
document.write('<script src="../../js/lib/qqapi.js?__inline=true"></script>');
document.write('<script src="../../js/lib/badjs.js?__inline=true"></script>');
document.write('<script src="../../js/package.init.js?__inline=true"></script>');

// 占位
if(this.seajs) {
    define(function() {});
}

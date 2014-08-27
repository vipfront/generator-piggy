// badjs业务标识
// 参考http://km.oa.com/group/20251/articles/show/175397接入
// badjs.init(/*填写自己的badjs id*/);

seajs.config({
    base: '../../js/',
    map: [
        [/.js$/, '.js?' + Date.now()]
    ]
});

// 添加一个占位符
if(this.seajs) {
    define(function() {});
}

;
(function(name, definition) {

    this[name] = definition();

    if (typeof define === 'function') {
        define(this[name]);
    } else if (typeof module === 'object') {
        module.exports = this[name];
    }

})('mqq', function(undefined) {
    "use strict";

    var exports = {};

    var ua = navigator.userAgent;

    var SLICE = Array.prototype.slice;
    var REGEXP_IOS_QQ = /(iPad|iPhone|iPod).*? (IPad)?QQ\/([\d\.]+)/;
    var REGEXP_ANDROID_QQ = /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/; // 国际版的 QQ 的 ua 是 sqi

    var UUIDSeed = 1; //从1开始, 因为QQ浏览器的注入广告占用了0, 避免冲突

    var aCallbacks = {}; // 调用回调

    var aReports = {}; // API 调用的名字跟回调序号的映射

    var aSupports = {}; // 保存 API 的版本支持信息

    var CODE_API_CALL = -100000; // 定义为 API 调用, 跟 API 的回调区分

    var CODE_API_CALLBACK = -200000; // 定义为 API 调用的返回, 但是不知道确切返回码

    var NEW_PROTOCOL_BACK_LIST = { // 4.7启用了新协议, 但是部分接口不支持, 这里做个黑名单, 目前都是 android 的接口
        'qbizApi': '5.0', // 5.0 会支持新协议
        'pay': '999999', // pay相关的暂时没有修改计划
        'SetPwdJsInterface': '999999', // 设置密码?
        'GCApi': '999999', //游戏中心
        'q_download': '999999', // 下载器
        'qqZoneAppList': '999999', // 
        'qzone_app': '999999', // 
        'qzone_http': '999999', // 
        'qzone_imageCache': '999999', // 
        'RoamMapJsPlugin': '999999' //
    };

    exports.debuging = false;

    exports.iOS = REGEXP_IOS_QQ.test(ua);
    exports.android = REGEXP_ANDROID_QQ.test(ua);
    if (exports.iOS && exports.android) {

        /*
         * 同时是 iOS 和 android 是不可能的, 但是有些国产神机很恶心,
         * 明明是 android, ua 上还加上个 iPhone 5s...
         * 这里要 fix 掉
         */
        exports.iOS = false;
    }

    exports.version = '20140826002';

    exports.QQVersion = '0';

    exports.ERROR_NO_SUCH_METHOD = 'no such method';
    exports.ERROR_PERMISSION_DENIED = 'permission denied';

    if (!exports.android && !exports.iOS) {
        console.log('mqqapi: not android or ios');
    }

    /**
     * 当a<b返回-1, 当a==b返回0, 当a>b返回1,
     * 约定当a或b非法则返回-1
     */
    function compareVersion(a, b) {
        a = String(a).split('.');
        b = String(b).split('.');
        try {
            for (var i = 0, len = Math.max(a.length, b.length); i < len; i++) {
                var l = isFinite(a[i]) && Number(a[i]) || 0,
                    r = isFinite(b[i]) && Number(b[i]) || 0;
                if (l < r) {
                    return -1;
                } else if (l > r) {
                    return 1;
                }
            }
        } catch (e) {
            return -1;
        }
        return 0;
    }

    exports.compare = function(ver) {
        return compareVersion(exports.QQVersion, ver);
    };

    if (exports.android) {
        exports.QQVersion = function(m) { // 从 ua 拿版本号
            return m && (m[3] || m[1]) || 0;
        }(ua.match(REGEXP_ANDROID_QQ));

        if (!window.JsBridge) { // 兼容 android
            window.JsBridge = {};
        }
        window.JsBridge.callMethod = invokeClientMethod;
        window.JsBridge.callback = execGlobalCallback;
        window.JsBridge.compareVersion = exports.compare;

    }

    if (exports.iOS) {

        window.iOSQQApi = exports; // 兼容 iOS
        exports.__RETURN_VALUE = undefined; // 用于接收客户端返回值

        exports.QQVersion = function(m) { // 从 ua 拿版本号
            return m && m[3] || 0;
        }(ua.match(REGEXP_IOS_QQ));

        // exports.QQVersion = function(){
        //     return invokeClientMethod('device', 'qqVersion') || 0;
        // }();

    }

    exports.platform = exports.iOS ? 'IPH' : exports.android ? 'AND' : 'OTH';


    var Report = (function() {
        var reportCache = [];

        var sendFrequency = 200;

        var timer = 0;

        var lastTimerTime = 0;

        var APP_ID = 1000218;

        var mainVersion = String(exports.QQVersion).split('.').slice(0, 3).join('.');

        var releaseVersion = exports.platform + "_MQQ_" + mainVersion;

        var qua = exports.platform + exports.QQVersion + '/' + exports.version;

        function sendReport() {
            var arr = reportCache;
            reportCache = [];
            timer = 0;

            if (!arr.length) {

                // 这次没有要上报的, 就关掉定时器
                return;
            }
            var params = {};

            params.appid = APP_ID; // 手机QQ JS API
            params.releaseversion = releaseVersion;
            // params.build = location.hostname + location.pathname;
            params.sdkversion = exports.version;
            params.qua = qua;
            params.frequency = 1;

            params.t = Date.now();

            params.key = ['commandid', 'resultcode', 'tmcost'].join(',');

            arr.forEach(function(a, i) {

                params[i + 1 + '_1'] = a[0];
                params[i + 1 + '_2'] = a[1];
                params[i + 1 + '_3'] = a[2];
            });

            var img = new Image();
            img.onload = function() {
                img = null;
            };

            img.src = 'http://wspeed.qq.com/w.cgi?' + toQuery(params);

            timer = setTimeout(sendReport, sendFrequency);
        }

        function send(api, retCode, costTime) {

            reportCache.push([api, retCode || 0, costTime || 0]);

            // if(Date.now() - lastTimerTime < sendFrequency){

            //     // 连续的 sendFrequency 时间内的上报都合并掉
            //     clearTimeout(timer);
            //     timer = 0;
            // }
            if (!timer) {
                lastTimerTime = Date.now();
                timer = setTimeout(sendReport, sendFrequency);
            }

        }

        return {
            send: send
        };

    })();


    var Console = (function() {

        function debug() {
            if (!exports.debuging) {
                return;
            }
            var argus = SLICE.call(arguments);
            var result = [];
            argus.forEach(function(a) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                result.push(a);
            });
            alert(result.join('\n'));
        }

        return {
            debug: debug
        };
    })();

    /**
     * 上报 API 调用和把 API 的回调跟 API 名字关联起来, 用于上报返回码和返回时间
     */
    function reportAPI(schema, ns, method, argus, sn) {

        if (!schema || !ns || !method) {

            // 非正常的 API 调用就不上报了
            return;
        }

        var uri = schema + '://' + ns + '/' + method;
        var a, i, l, m;

        argus = argus || [];

        if (!sn || !(aCallbacks[sn] || window[sn])) {

            // 尝试从参数中找到回调参数名作为 sn
            sn = null;
            for (i = 0, l = argus.length; i < l; i++) {
                a = argus[i];
                if (typeof a === 'object') {

                    a = a.callbackName || a.callback;
                }
                if (a && (aCallbacks[a] || window[a])) {
                    sn = a;
                    break;
                }
            }
        }

        if (sn) { // 记录 sn 和 uri 的对应关系
            aReports[sn] = {
                uri: uri,
                startTime: Date.now()
            };
            m = String(sn).match(/__MQQ_CALLBACK_(\d+)/);
            if (m) { //  兼容直接使用 createCallbackName 生成回调的情况
                aReports[m[1]] = aReports[sn];
            }
        }
        // Console.debug('sn: ' + sn, aReports);
        // 发上报请求
        Report.send(uri, CODE_API_CALL);
    }

    /**
     * 创建名字空间
     * @param  {String} name
     */
    function createNamespace(name) {
        var arr = name.split('.');
        var space = window;
        arr.forEach(function(a) {
            !space[a] && (space[a] = {});
            space = space[a];
        });
        return space;
    }

    /**
     * 创建回调的名字
     * @param  {Function} func
     * @param  {Boolean} deleteOnExec  为 true 则执行一次之后就删除该 function
     * @param  {Boolean} execOnNewThread
     * @return {String}
     */
    function createCallbackName(callback, deleteOnExec, execOnNewThread) {

        var func = (typeof callback === "function") ? callback : window[callback];
        if (!func) {
            return;
        }

        var sn = storeCallback(callback);

        var name = '__MQQ_CALLBACK_' + sn;

        window[name] = function() {

            var argus = SLICE.call(arguments);

            fireCallback(sn, argus, deleteOnExec, execOnNewThread);

        };
        return name;
    }

    function storeCallback(callback) {
        var sn = UUIDSeed++;
        if (callback) {
            aCallbacks[sn] = callback;
        }
        return sn;
    }

    /**
     * 所有回调的最终被执行的入口函数
     */
    function fireCallback(sn, argus, deleteOnExec, execOnNewThread) {
        var callback = typeof sn === 'function' ? sn : (aCallbacks[sn] || window[sn]);
        var endTime = Date.now();
        argus = argus || [];
        // Console.debug('fireCallback, sn: ' + sn);
        if (typeof callback === 'function') {
            if (execOnNewThread) {
                setTimeout(function() {

                    callback.apply(null, argus);
                }, 0);
            } else {
                callback.apply(null, argus);
            }
        } else {

            console.log('mqqapi: not found such callback: ' + sn);
        }
        if (deleteOnExec) {
            delete aCallbacks[sn];
            delete window['__MQQ_CALLBACK_' + sn];
        }

        // Console.debug('sn: ' + sn + ', aReports[sn]: ' + aReports[sn])
        // 上报 API 调用返回
        if (aReports[sn]) {
            var obj = aReports[sn];
            delete aReports[sn];
            if (Number(sn)) {
                delete aReports['__MQQ_CALLBACK_' + sn];
            }
            var retCode = CODE_API_CALLBACK;

            // 提取返回结果中的 retCode
            var keys = ['retCode', 'retcode', 'resultCode', 'ret', 'code', 'r'];
            var a, j, n;
            // Console.debug(argus);
            if (argus.length) {
                a = argus[0]; // 只取第一个参数来判断

                if (typeof a === 'object' && a !== null) { // 返回码可能在 object 里
                    for (j = 0, n = keys.length; j < n; j++) {
                        if (keys[j] in a) {
                            retCode = a[keys[j]];
                            break;
                        }
                    }
                } else if (/^-?\d+$/.test(String(a))) { // 第一个参数是个整数, 认为是返回码
                    retCode = a;
                }
            }

            // 发上报请求
            Report.send(obj.uri + '#callback', retCode, endTime - obj.startTime);
        }
    }

    /**
     * android / iOS 5.0 开始, client回调 js, 都通过这个入口函数处理
     */
    function execGlobalCallback(sn /*, data*/ ) {
        Console.debug('execGlobalCallback: ' + JSON.stringify(arguments));

        var argus = SLICE.call(arguments, 1);

        if (exports.android && argus && argus.length) {

            // 对 android 的回调结果进行兼容
            // android 的旧接口返回会包装个 {r:0,result:123}, 要提取出来
            argus.forEach(function(data, i) {
                if (typeof data === 'object' && ('r' in data) && ('result' in data)) {
                    argus[i] = data.result;
                }
            });
        }

        fireCallback(sn, argus);
    }

    /**
     * 空的api实现, 用于兼容在浏览器调试, 让mqq的调用不报错
     */
    function emptyAPI() {
        // var argus = SLICE.call(arguments);
        // var callback = argus.length && argus[argus.length-1];
        // return (typeof callback === 'function') ? callback(null) : null;
    }

    /**
     * 创建 api 方法, 把指定 api 包装为固定的调用形式
     */
    function buildAPI(name, data) {
        var func = null;
        var index = name.lastIndexOf('.');
        var nsName = name.substring(0, index);
        var methodName = name.substring(index + 1);

        var ns = createNamespace(nsName);

        if (data.iOS && exports.iOS) {

            // 这里担心有业务没有判断方法是否存在就调用了, 还是去掉这个吧 az 2014/8/19
            // if (data.support && data.support.iOS) {
            //     if (exports.compare(data.support.iOS) > -1) {
            //         func = data.iOS;
            //     }
            // } else {
            func = data.iOS;
            // }
        } else if (data.android && exports.android) {

            // if (data.support && data.support.android) {
            //     if (exports.compare(data.support.android) > -1) {
            //         func = data.android;
            //     }
            // } else {
            func = data.android;
            // }
        } else if (data.browser) { // 某些 api 可能有浏览器兼容的方式
            func = data.browser;
        }
        ns[methodName] = func || emptyAPI;
        aSupports[name] = data.support;

    }

    function supportVersion(name) {

        var support = aSupports[name] || aSupports[name.replace('qw.', 'mqq.')];
        var env = exports.iOS ? 'iOS' : exports.android ? 'android' : 'browser';

        if (!support || !support[env]) {
            return false;
        }

        return exports.compare(support[env]) > -1;
    }

    /**
     * 使用 iframe 发起伪协议请求给客户端
     */
    function openURL(url, sn) {
        Console.debug('openURL: ' + url);
        var iframe = document.createElement('iframe');
        iframe.style.cssText = 'display:none;width:0px;height:0px;';
        var failCallback = function() {

            /*
                正常情况下是不会回调到这里的, 只有客户端没有捕获这个 url 请求,
                浏览器才会发起 iframe 的加载, 但这个 url 实际上是不存在的, 
                会触发 404 页面的 onload 事件
            */
            execGlobalCallback(sn, {
                r: -201,
                result: 'error'
            });
        };
        if (exports.iOS) {

            /* 
                ios 必须先赋值, 然后 append, 否者连续的 api调用会间隔着失败
                也就是 api1(); api2(); api3(); api4(); 的连续调用, 
                只有 api1 和 api3 会真正调用到客户端
            */
            iframe.onload = failCallback;
            iframe.src = url;
        }
        var container = document.body || document.documentElement;
        container.appendChild(iframe);

        /*
            android 这里必须先添加到页面, 然后再绑定 onload 和设置 src
            1. 先设置 src 再 append 到页面, 会导致在接口回调(callback)中嵌套调用 api会失败, 
                iframe会直接当成普通url来解析
            2. 先设置onload 在 append , 会导致 iframe 先触发一次 about:blank 的 onload 事件

         */
        if (exports.android) { // android 必须先append 然后赋值
            iframe.onload = failCallback;
            iframe.src = url;
        }

        // iOS 可以同步获取返回值, 因为 iframe 的url 被客户端捕获之后, 会挂起 js 进程
        var returnValue = exports.__RETURN_VALUE;
        exports.__RETURN_VALUE = undefined;

        // android 捕获了iframe的url之后, 也是中断 js 进程的, 所以这里可以用个 setTimeout 0 来删除 iframe
        setTimeout(function() {
            iframe.parentNode.removeChild(iframe);
        }, 0);

        return returnValue;
    }

    // 三星特供版, 从 4.2.1 开始有, 4.2.1 已经去掉了注入到全局对象的方法
    exports.__androidForSamsung = /_NZ\b/.test(ua);

    // android 的 jsbridge 协议开始支持的版本 4.5, 三星特供版也可以用 jsbridge 协议
    exports.__supportAndroidJSBridge = exports.android && (exports.compare('4.5') > -1 || exports.__androidForSamsung);

    // android 新 jsbridge 协议
    exports.__supportAndroidNewJSBridge = exports.android && exports.compare('4.7.2') > -1;

    function canUseNewProtocal(ns /*, method*/ ) {
        if (exports.iOS) { // iOS 旧版本的客户端也能很好兼容新协议
            return true;
        }
        if (exports.android && exports.__supportAndroidNewJSBridge) {

            if (NEW_PROTOCOL_BACK_LIST[ns] && exports.compare(NEW_PROTOCOL_BACK_LIST[ns]) < 0) {

                // 部分接口在 4.7.2 还不能使用新协议, 后续版本会修复该问题
                return false;
            }
            return true;
        }
        return false;
    }

    function invokeClientMethod(ns, method, argus, callback) {
        if (!ns || !method) {
            return null;
        }
        var url, sn; // sn 是回调函数的序列号
        argus = SLICE.call(arguments, 2);
        callback = argus.length && argus[argus.length - 1];

        if (callback && typeof callback === 'function') { // args最后一个参数是function, 说明存着callback
            argus.pop();
        } else if (typeof callback === 'undefined') {

            // callback 是undefined的情况, 可能是 api 定义了callback, 但是用户没传 callback, 这时候要把这个 undefined的参数删掉
            argus.pop();
        } else {
            callback = null;
        }

        // 统一生成回调序列号, callback 为空也会返回 sn 
        sn = storeCallback(callback);

        // 上报 API 调用, openURL 会阻塞 js 线程, 因此要先打点和上报
        reportAPI('jsbridge', ns, method, argus, sn);

        if (exports.android && !exports.__supportAndroidJSBridge) {

            /* 
                兼容Android QQ 4.5以下版本的客户端API调用方式
                排除掉三星特供版, 他可以用 jsbridge 协议
            */
            if (window[ns] && window[ns][method]) {
                var result = window[ns][method].apply(window[ns], argus);
                if (callback) {

                    fireCallback(sn, [result]);
                } else {
                    return result;
                }
            } else if (callback) {
                fireCallback(sn, [exports.ERROR_NO_SUCH_METHOD]);
            }
        } else if (canUseNewProtocal(ns, method)) {

            /* 
                android 4.7 以上的支持 ios的协议, 但是客户端的旧接口需要迁移, 4.7赶不上, 需要等到 4.7.2
                jsbridge://ns/method?p=test&p2=xxx&p3=yyy#123
            */
            url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method);

            argus.forEach(function(a, i) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                if (i === 0) {
                    url += '?p=';
                } else {
                    url += '&p' + i + '=';
                }
                url += encodeURIComponent(String(a));
            });

            // 加上回调序列号
            url += '#' + sn;

            var r = openURL(url);
            if (exports.iOS) {

                // FIXME 这里可能会导致回调两次, 但是 iOS 4.7.2以前的接口是依靠这里实现异步回调, 因此要验证下
                r = r ? r.result : null;
                if (callback) {
                    fireCallback(sn, [r], false /*deleteOnExec*/ , true /*execOnNewThread*/ );
                } else {
                    return r;
                }
            }

        } else if (exports.android) { // android 4.7 以前的旧协议, 不能使用新协议的 android 会 fallback 到这里

            // jsbridge://ns/method/123/test/xxx/yyy
            url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '/' + sn;

            argus.forEach(function(a) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                url += '/' + encodeURIComponent(String(a));
            });

            openURL(url, sn);
        }

        return null;
    }

    // 执行原有的伪协议接口
    function invokeSchemaMethod(schema, ns, method, params, callback) {
        if (!schema || !ns || !method) {
            return null;
        }

        var argus = SLICE.call(arguments),
            sn;
        if (typeof argus[argus.length - 1] === 'function') {
            callback = argus[argus.length - 1];
            argus.pop();
        } else {
            callback = null;
        }
        if (argus.length === 4) {
            params = argus[argus.length - 1];
        } else {
            params = {};
        }
        if (callback) {
            params['callback_type'] = 'javascript';
            sn = createCallbackName(callback);
            params['callback_name'] = sn;
        }
        params['src_type'] = params['src_type'] || 'web';

        if (!params.version) {
            params.version = 1;
        }
        var url = schema + '://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '?' + toQuery(params);
        openURL(url);

        // 上报 API 调用
        reportAPI(schema, ns, method, argus, sn);
    }

    //////////////////////////////////// util /////////////////////////////////////////////////
    function mapQuery(uri) {
        var i,
            key,
            value,
            index = uri.indexOf("?"),
            pieces = uri.substring(index + 1).split("&"),
            params = {};
        for (i = 0; i < pieces.length; i++) {
            index = pieces[i].indexOf("=");
            key = pieces[i].substring(0, index);
            value = pieces[i].substring(index + 1);
            params[key] = decodeURIComponent(value);
        }
        return params;
    }

    function toQuery(obj) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(obj[key])));
            }
        }
        return result.join("&");
    }

    function removeQuery(url, keys) {
        var a = document.createElement('a');
        a.href = url;
        var obj;
        if (a.search) {
            obj = mapQuery(String(a.search).substring(1));
            keys.forEach(function(k) {
                delete obj[k];
            });
            a.search = '?' + toQuery(obj);
        }
        if (a.hash) {
            obj = mapQuery(String(a.hash).substring(1));
            keys.forEach(function(k) {
                delete obj[k];
            });
            a.hash = '#' + toQuery(obj);
        }
        url = a.href;
        a = null;

        return url;
    }

    //////////////////////////////////// end util /////////////////////////////////////////////////


    //////////////////////////////////// event /////////////////////////////////////////////////

    // 监听客户端或者其他 webview 抛出的事件
    function addEventListener(eventName, handler) {
        var evtKey = 'evt-' + eventName;
        (aCallbacks[evtKey] = aCallbacks[evtKey] || []).push(handler);
        return true;
    }

    // 移除事件监听, 如果没有传 handler, 就把该事件的所有监听都移除
    function removeEventListener(eventName, handler) {
        var evtKey = 'evt-' + eventName;
        var handlers = aCallbacks[evtKey];
        var flag = false;
        if (!handlers) {
            return false;
        }
        if (!handler) {
            delete aCallbacks[evtKey];
            return true;
        }

        for (var i = handlers.length - 1; i >= 0; i--) {
            if (handler === handlers[i]) {
                handlers.splice(i, 1);
                flag = true;
            }
        }

        return flag;
    }

    // 这个方法时客户端回调页面使用的, 当客户端要触发事件给页面时, 会调用这个方法
    function execEventCallback(eventName /*, data, source*/ ) {
        var evtKey = 'evt-' + eventName;
        var handlers = aCallbacks[evtKey];
        var argus = SLICE.call(arguments, 1);
        if (handlers) {
            handlers.forEach(function(handler) {
                fireCallback(handler, argus, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
            });
        }
    }

    /**
    通知一个事件给客户端webview, 可以用于多个 webview 之间进行通信, 用 domains 来指定需要通知到的域名

    对应的协议为:
        jsbridge://event/dispatchEvent?p={
            event:eventName
            data:{...},
            options: {...}
        }#id

        options:
        {Boolean} [echo]: 当前webview是否能收到这个事件，默认为true
        {Boolean} [broadcast]: 是否广播模式给其他webview，默认为true
        {Array<String>} [domains]: 指定能接收到事件的域名，默认只有同域的webview能接收，支持通配符，比如‘*.qq.com’匹配所有qq.com和其子域、‘*’匹配所有域名。注意当前webview是否能接收到事件只通过echo来控制，这个domains限制的是非当前webview。
    */
    function dispatchEvent(eventName, data, options) {

        var params = {
            event: eventName,
            data: data || {},
            options: options || {}
        };

        if (exports.android && params.options.broadcast === false && exports.compare('5.2') < 0) {
            // 对 android 的 broadcast 事件进行容错, broadcast 为 false 时, 没有 Webview会接收到该事件, 但客户端依然要能接收
            // 5.2 已经修复该问题
            params.options.domains = ['localhost'];
            params.options.broadcast = true;
        }

        var url = 'jsbridge://event/dispatchEvent?p=' + encodeURIComponent(JSON.stringify(params) || '');
        openURL(url);

        reportAPI('jsbridge', 'event', 'dispatchEvent');
    }


    //////////////////////////////////// end event /////////////////////////////////////////////////

    // for debug
    exports.__aCallbacks = aCallbacks;
    exports.__aReports = aReports;
    exports.__aSupports = aSupports;

    // for internal use
    exports.__fireCallback = fireCallback;
    exports.__reportAPI = reportAPI;

    exports.build = buildAPI;
    exports.support = supportVersion;
    exports.invoke = invokeClientMethod;
    exports.invokeSchema = invokeSchemaMethod;
    exports.callback = createCallbackName;
    exports.execGlobalCallback = execGlobalCallback;

    // util
    exports.mapQuery = mapQuery;
    exports.toQuery = toQuery;
    exports.removeQuery = removeQuery;

    // event
    exports.addEventListener = addEventListener;
    exports.removeEventListener = removeEventListener;

    exports.execEventCallback = execEventCallback;
    exports.dispatchEvent = dispatchEvent;

    return exports;

});
// 适配原来的 android jsbridge.js 中定义的接口, ios 没有
// 这个文件是原来的 jsbridge.js 的重新整理, 修复了 jsbridge 跟 mqqapi.js 混用时, jsbridge 的异步接口没有回调的bug
;(function(undefined){
    "use strict";

    var SLICE = Array.prototype.slice;

    //apis map
    var apis0 = {
        /*'mediaPlayerJS':[
            'setDataSource', 'play', 'stop', 'getCurrentPosition', 'getDuration', 'isPlaying'
        ],*/
        'QQApi':[
            //4.1
            'isAppInstalled', 'isAppInstalledBatch', 'startAppWithPkgName',
            //4.2
            'checkAppInstalled', 'checkAppInstalledBatch', 'getOpenidBatch',
            'startAppWithPkgNameAndOpenId'
        ]/*,
        'HtmlViewer':[
            //4.2
            'showHTML'
        ]*/
    };
    var apis45 = {'QQApi':['lauchApp']};
    var apisPA0 = {
        'publicAccount':[
            //4.2
            'close', 'getJson', 'getLocation', 'hideLoading',
            'openInExternalBrowser', 'showLoading', 'viewAccount'
        ]
    };
    var apisPA45 = {
        'publicAccount':[
            //4.3
            'getMemberCount', 'getNetworkState', 'getValue', 'open',
            'openEmoji', 'openUrl', 'setRightButton',
            'setValue', 'shareMessage', 'showDialog'
        ],
        'qqZoneAppList':[
            'getCurrentVersion', 'getSdPath', 'getWebDisplay',
            'goUrl',
            //4.2
            'openMsgCenter', 'showDialog',
            //4.3
            'setAllowCallBackEvent'
        ],
        'q_download':[
            'doDownloadAction', 'getQueryDownloadAction', 'registerDownloadCallBackListener',
            //4.1
            'cancelDownload', 'cancelNotification'//,
            //4.2 这个接口不存在
            //'doGCDownloadAction'
        ],
        'qzone_http':[
            //4.1
            'httpRequest'
        ],
        'qzone_imageCache':[
            'downloadImage', 'getImageRootPath', 'imageIsExist', 'sdIsMounted',
            'updateImage',
            //4.1
            'clearImage'
        ],
        'qzone_app':[
            'getAllDownAppInfo', 'getAppInfo', 'getAppInfoBatch', 'startSystemApp', 'uninstallApp'
        ]
    };
    var apisCoupon = {
        'coupon':[
            'addCoupon', 'addFavourBusiness', 'gotoCoupon', 'gotoCouponHome',
            'isCouponValid', 'isFavourBusiness', 'isFavourCoupon', 'removeFavourBusiness'
        ]
    };

    var ua = navigator.userAgent;

    var mayHaveNewApi = mqq.__supportAndroidJSBridge;

    var oldApis = {};

    function buildAPI(ns, method, isNewApi){
        if(isNewApi){
            return function(){
                var argus = [ns, method].concat(SLICE.call(arguments));
                mqq.invoke.apply(mqq, argus);
            };
        }else{
            return function(){
                var argus = SLICE.call(arguments);
                return oldApis[ns][method].apply(oldApis[ns], argus);
            };
        }
        
    }

    function restoreApis(apis, baseLevel){
        baseLevel = baseLevel || 1;
        if(mqq.compare(baseLevel) < 0){ //比较api版本, 如果当前版本太低, 则跳过
            console.info('jsbridge: version not match, apis ignored');
            return;
        }

        for(var objname in apis){
            var methods = apis[objname];
            if(!methods || !methods.length || !Array.isArray(methods)){
                continue;
            }
            var apiObj = window[objname];
            if(!apiObj){
                if(mayHaveNewApi){
                    window[objname] = {};
                }else{
                    continue;
                }
            }else if(typeof apiObj === 'object' && apiObj.getClass){ //detect java object
                oldApis[objname] = apiObj;
                window[objname] = {};
            }
            var oldApi = oldApis[objname];
            apiObj = window[objname];
            for(var i = 0, l = methods.length; i<l; i++){
                var method = methods[i];
                if(apiObj[method]){ //already exist
                    continue;
                }else if(!oldApi){ // wrap a jsbridge function
                    apiObj[method] = buildAPI(objname, method, true);
                }else if(oldApi[method]){ // wrap old api function
                    apiObj[method] = buildAPI(objname, method, false);
                }
            }
        }
    }

    if(!window.JsBridge){
        window.JsBridge = {};
    }
    window.JsBridge.restoreApis = restoreApis;

    restoreApis(apis0);
    restoreApis(apis45, '4.5');
    if(mayHaveNewApi){ //新api有UA标识
        if(/\bPA\b/.test(ua) || mqq.compare('4.6') >= 0){ //公众帐号webview, 4.2开始有, 所有webview, 4.6开始有
            restoreApis(apisPA0);
            restoreApis(apisPA45, '4.5');
            restoreApis(apisCoupon, '4.5');
        }else if(/\bQR\b/.test(ua)){ //二维码webview, 从4.5开始可以打开网页
            restoreApis(apisCoupon, '4.5');
            //4.5二维码webview的publicAccount.openUrl被混淆了,这里hardcode修复一下
            if(mqq.compare('4.5') >=0 && mqq.compare('4.6') < 0){
                window['publicAccount'] = {
                    openUrl:function(url){
                        location.href = url;
                    }
                };
            }
        }
    }else{ //旧版本不能通过UA判断webview, 但能够通过特征检测判断有没有对应api
        restoreApis(apisPA0, '4.2');
    }



})();
/**
    @param {Object}
    String url
    int [target]
    String [relatedAccount]
    String [relatedAccountType]

    @return {void}

    target:
    0: 在当前webview打开
    1: 在新webview打开
    2: 在外部浏览器上打开（iOS为Safari,Android为系统默认浏览器）

    style（只对target=1有效）:
    0: 顶部控制栏模式（默认）
    1: 顶部控制栏无分享入口
    2: 底部工具栏模式（顶部的bar依然会存在）
    3: 底部工具栏无分享入口（顶部的bar依然会存在）

    relatedAccount和relatedAccountType用于传入与该webview相关的帐号和帐号类型，比如传入公众帐号可在分享菜单里显示相关的分享选项（同样只对target=1有效）：
    relatedAccountType:
    ‘officalAccount’：公众帐号

    @example
    mqq.ui.openUrl({
       url: ‘http://web.qq.com’,
       target: 1,
       style: 3
    });
*/

mqq.build('mqq.ui.openUrl', {
    iOS: function(params) {
        if (!params) {
            params = {};
        }
        switch (params.target) {
            case 0:
                window.open(params.url, '_self');
                break;
            case 1:
                params.styleCode = ({
                    1: 4,
                    2: 2,
                    3: 5
                })[params.style] || 1;
                mqq.invoke('nav', 'openLinkInNewWebView', {
                    'url': params.url,
                    'options': params
                });
                break;
            case 2:
                mqq.invoke('nav', 'openLinkInSafari', {
                    'url': params.url
                });
                break;
        }
    },
    android: function(params) {
        if (params.target === 2) {
            if (mqq.compare('4.6') >= 0) {
                mqq.invoke('publicAccount', 'openInExternalBrowser', params.url);
            } else if (mqq.compare('4.5') >= 0) {
                mqq.invoke('openUrlApi', 'openUrl', params.url);
            } else {
                // location.href = params.url;
            }
        } else if (params.target === 1) {
            if (!params.style) {
                params.style = 0;
            }
            if (mqq.compare('4.6') >= 0) {
                mqq.invoke('qbizApi', 'openLinkInNewWebView', params.url, params.style);
            } else if (mqq.compare('4.5') >= 0) {
                mqq.invoke('publicAccount', 'openUrl', params.url);
            } else {
                location.href = params.url;
            }
        } else {
            location.href = params.url;
        }
    },
    browser: function(params) { // 兼容普通浏览器的调用
        if (params.target === 2) {
            window.open(params.url, '_blank');
        } else {
            location.href = params.url;
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6',
        browser: '0'
    }
});
/**
* 
刷新客户端显示的网页标题

在iOS中，网页标题动态改变后，显示WebView的导航栏标题不会改变，请调用refreshTitle来手动刷新。Android不需要。

 */

mqq.build('mqq.ui.refreshTitle', {
    iOS: function() {
        mqq.invoke('nav', 'refreshTitle');
    },
    support: {
        iOS: '4.6'
    }
});
mqq.build('mqq.app.launchAppWithTokens', {
    iOS: function(params, paramsStr) {
        //判断参数是4.6的接口样式
        if (typeof params === 'object') {
            return mqq.invoke('app', 'launchApp', params);
        }
        //判断参数是4.5的接口样式
        return mqq.invoke('app', 'launchApp', {
            'appID': params,
            'paramsStr': paramsStr
        });
    },
    android: function(params) {
        if (mqq.compare('4.6') >= 0) {
            mqq.invoke('QQApi', 'launchAppWithTokens', params.appID,
                params.paramsStr, params.packageName, params.flags || params.falgs || 0);
        } else {
            mqq.invoke('QQApi', 'launchApp', params.appID,
                params.paramsStr, params.packageName);
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});
/**
 拉取地理位置
 */
mqq.build('mqq.sensor.getLocation', {
    iOS: function(callback) {

        return mqq.invoke('data', 'queryCurrentLocation', {
            'callback': mqq.callback(callback)
        });
    },
    android: function(callback) {
        var callbackName = mqq.callback(function(result) {
            var retCode = -1,
                longitude = null,
                latitude = null;
            if (result && result !== 'null') {
                result = (result + '').split(',');
                if (result.length === 2) {
                    retCode = 0; // 获取的是经纬度

                    longitude = parseFloat(result[0] || 0);
                    latitude = parseFloat(result[1] || 0);
                }
            }
            callback(retCode, latitude, longitude);
        }, true);
        mqq.invoke('publicAccount', 'getLocation', callbackName);
    },
    browser: function(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {

                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;

                callback(0, latitude, longitude);
            }, function( /*error*/ ) {
                // switch (error.code) { 
                // case 0: 
                //     alert(“尝试获取您的位置信息时发生错误：” + error.message); 
                //     break; 
                // case 1: 
                //     alert(“用户拒绝了获取位置信息请求。”); 
                //     break; 
                // case 2: 
                //     alert(“浏览器无法获取您的位置信息。”); 
                //     break; 
                // case 3: 
                //     alert(“获取您位置信息超时。”); 
                //     break; 
                // } 
                callback(-1);
            });
        } else {
            callback(-1);
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6',
        browser: '0'
    }
});
/**
 获取客户端信息
 @param {Function} callback(data)
   {Object} data
        - String qqVersion
        - String qqBuild
 */

/* iOS 接口兼容 */
mqq.build('mqq.device.qqVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'qqVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.qqBuild', {
    iOS: function(callback) {

        return mqq.invoke('device', 'qqBuild', callback);
    },
    support: {
        iOS: '4.5'
    }
});
/*end iOS 接口兼容 */

mqq.build('mqq.device.getClientInfo', {
    iOS: function(callback) {
        var result = {
            'qqVersion': this.qqVersion(),
            'qqBuild': this.qqBuild()
        };
        var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        mqq.__reportAPI('web', 'device', 'getClientInfo', null, callbackName);
        if (typeof callback === 'function') {
            mqq.__fireCallback(callbackName, [result]);
        } else {
            return result;
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            var oldCallback = callback;
            callback = function(data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {}
                oldCallback && oldCallback(data);
            };
            mqq.invoke('qbizApi', 'getClientInfo', callback);
        } else {
            mqq.__reportAPI('web', 'device', 'getClientInfo');
            callback({
                qqVersion: mqq.QQVersion,
                qqBuild: function(m) {
                    m = m && m[1] || 0;
                    return m && m.slice(m.lastIndexOf('.') + 1) || 0;
                }(navigator.userAgent.match(/\bqq\/([\d\.]+)/i))
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});
/* iOS 接口兼容 */

mqq.build('mqq.device.systemName', {
    iOS: function(callback) {

        return mqq.invoke('device', 'systemName', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.systemVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'systemVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.model', {
    iOS: function(callback) {

        return mqq.invoke('device', 'model', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.modelVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'modelVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

/* end iOS 接口兼容 */

mqq.build('mqq.device.getDeviceInfo', {

    iOS: function(callback) {

        if (mqq.compare(4.7) >= 0) {
            //4.7把下面這些調用都整合到一個接口上，並提供了一個新的字段identifier來唯一標識設備
            return mqq.invoke('device', 'getDeviceInfo', callback);
        } else {
            var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
            mqq.__reportAPI('web', 'device', 'getClientInfo', null, callbackName);

            var result = {
                'isMobileQQ': this.isMobileQQ(),
                'systemName': this.systemName(),
                'systemVersion': this.systemVersion(),
                'model': this.model(),
                'modelVersion': this.modelVersion()
            };

            if (typeof callback === 'function') {
                mqq.__fireCallback(callbackName, [result]);
            } else {
                return result;
            }
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            var oldCallback = callback;
            callback = function(data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {}
                oldCallback && oldCallback(data);
            };
            mqq.invoke('qbizApi', 'getDeviceInfo', callback);
        } else {
            var ua = navigator.userAgent;
            mqq.__reportAPI('web', 'device', 'getClientInfo');
            callback({
                isMobileQQ: true,
                systemName: 'android',
                systemVersion: function(m) {
                    return m && m[1] || 0;
                }(ua.match(/\bAndroid ([\d\.]+)/i)),
                model: function(m) {
                    return m && m[1] || null;
                }(ua.match(/;\s([^;]+)\s\bBuild\/\w+/i))
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.5'
    }
});
/**
 获取当前用户的网络类型
 @param {Function} callback(result)
     - {int} result
        -1: Unknown 未知类型网络
        0: NotReachable
        1: ReachableViaWiFi
        2: ReachableVia3G
        3: ReachableVia2G
        4. 4G   
 */

mqq.build('mqq.device.getNetworkType', {
    iOS: function(callback) {
        var result = mqq.invoke('device', 'networkStatus');
        result = Number(result); // 4.7.1 返回的是字符串数字...
        if (typeof callback === 'function') {
            mqq.__fireCallback(callback, [result], false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        } else {
            return result;
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            mqq.invoke('qbizApi', 'getNetworkType', callback);
        } else {
            mqq.invoke('publicAccount', 'getNetworkState', function(state) {
                // 0: mobile, 1: wifi, 2...: other
                var map = {
                    '-1': 0,
                    '0': 3,
                    '1': 1
                };
                var newState = (state in map) ? map[state] : 4;
                callback(newState);
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});

/* iOS 的接口兼容 */
mqq.build('mqq.device.networkStatus', {
    iOS: mqq.device.getNetworkType,
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.networkType', {
    iOS: mqq.device.getNetworkType,
    support: {
        iOS: '4.5'
    }
});
/* end iOS 的接口兼容 */
//查看指定uin的个人资料卡

mqq.build('mqq.ui.showProfile', {
    iOS: function(params) {
        if (mqq.compare('4.7') >= 0) {

            mqq.invoke('nav', 'showProfile', params);
        } else if (mqq.compare('4.6') >= 0 && !params.uinType) {
            // 4.6 版本不支持 type 参数
            mqq.invoke('nav', 'showProfile', params);
        } else { // 低版本使用 schema 接口

            if (params.uinType === 1) {
                params['card_type'] = 'group';
            }
            mqq.invokeSchema('mqqapi', 'card', 'show_pslcard', params);
        }
    },
    android: function(params) {
        if (mqq.compare('4.7') >= 0) {

            mqq.invoke('publicAccount', 'showProfile', params);
        } else if (mqq.compare('4.6') >= 0 && !params.uinType) {
            // 4.6 版本不支持 type 参数
            mqq.invoke('publicAccount', 'showProfile', params.uin);
        } else { // 低版本使用 schema 接口

            if (params.uinType === 1) {
                params['card_type'] = 'group';
            }
            mqq.invokeSchema('mqqapi', 'card', 'show_pslcard', params);
        }
    },
    support: {
        iOS: '4.5',
        android: '4.5'
    }
});
/**
    返回打开webview的上一层view 
*/

mqq.build('mqq.ui.popBack', {
    iOS: function() {
        mqq.invoke('nav', 'popBack');
    },
    android: function() {
        mqq.invoke('publicAccount', 'close');
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});
/**
 打开指定的viewController
 @param {Object} options
     - {String} name viewController的名字，可取如下值：
     - 'ChatAvatarSetting'   聊天气泡
     - 'MarketFace'          表情商城
     - 'Coupon'              优惠券
     - 'UserSummary'         用户自己的资料页面
 */
;
(function() {

    var IOS_VIEW_MAP = {

    };

    var AND_VIEW_MAP = {
        'Abount': 'com.tencent.mobileqq.activity.AboutActivity',

        'GroupTribePublish': 'com.tencent.mobileqq.troop.activity.TroopBarPublishActivity',
        'GroupTribeReply': 'com.tencent.mobileqq.troop.activity.TroopBarReplyActivity',
        'GroupTribeComment': 'com.tencent.mobileqq.troop.activity.TroopBarCommentActivity'
    };


    mqq.build('mqq.ui.openView', {
        iOS: function(params) {

            params.name = IOS_VIEW_MAP[params.name] || params.name;
            if (typeof params.onclose === 'function') {
                params.onclose = mqq.callback(params.onclose);
            }
            mqq.invoke('nav', 'openViewController', params);
        },
        android: function(params) {

            params.name = AND_VIEW_MAP[params.name] || params.name;
            if (typeof params.onclose === 'function') {
                params.onclose = mqq.callback(params.onclose);
            }
            if (mqq.compare('5.0') > -1) {
                mqq.invoke('ui', 'openView', params);
            } else {
                mqq.invoke('publicAccount', 'open', params.name);
            }
        },
        support: {
            iOS: '4.5',
            android: '4.6'
        }
    });

})();
/**
 设置webview右上角按钮的标题和回调
 */

mqq.build('mqq.ui.setActionButton', {
    iOS: function(params, callback) {
        if (typeof params !== 'object') {
            params = {
                title: params
            };
        }

        var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        params.callback = callbackName;
        mqq.invoke('nav', 'setActionButton', params);
    },
    android: function(params, callback) {
        var callbackName = mqq.callback(callback);

        if (params.hidden) {
            params.title = '';
        }

        if (mqq.compare('4.7') >= 0) {
            params.callback = callbackName;
            mqq.invoke('ui', 'setActionButton', params);
        } else {
            mqq.invoke('publicAccount', 'setRightButton', params.title, '', callbackName);
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});
/**
 配置webview的行为
 @param {Object} 配置项，支持如下配置：
[swipeBack]     是(1)否(0)支持右划关闭手势
[actionButton]  是(1)否(0)显示右上角按钮

 */

mqq.build('mqq.ui.setWebViewBehavior', {
    iOS: function(params) {
        mqq.invoke("ui", "setWebViewBehavior", params);
    },
    android: function(params) {
        mqq.invoke("ui", "setWebViewBehavior", params);
    },
    support: {
        iOS: '4.7.2',
        android: '5.1'
    }
});
mqq.build('mqq.device.isMobileQQ', {
    iOS: function(callback) {
        var result = mqq.iOS;
        return callback ? callback(result) : result;
    },
    android: function(callback) {
        var result = mqq.android;
        return callback ? callback(result) : result;
    },
    browser: function(callback) {
        var result = mqq.android || mqq.iOS;
        return callback ? callback(result) : result;
    },
    support: {
        iOS: '4.2',
        android: '4.2'
    }
});
mqq.build('mqq.tenpay.openService', {

    android: function(params, callback) {
        mqq.invoke('pay', 'openService', JSON.stringify(params), callback);
    },
    support: {
        android: '4.6.1'
    }
});
mqq.build('mqq.tenpay.rechargeQb', {

    android: function(params, callback) {
        mqq.invoke('pay', 'rechargeQb', JSON.stringify(params), callback);
    },
    support: {
        android: '4.6.1'
    }
});
/**
弹出一个确认框
@param {Object}
     - String title
     - String text
     - Boolean [needOkBtn] //是否显示确认按钮，默认true
     - Boolean [needCancelBtn] //是否显示取消按钮，默认true
@param {Function} [callback(result)]
     - result.button == 0, //点击了确认按钮
     - result.button == 1,//点击了取消按钮
*/

mqq.build('mqq.ui.showDialog', {
    iOS: function(params, callback) {
        if (params) {
            params.callback = mqq.callback(callback, true /*deleteOnExec*/ , true /*execOnNewThread*/ );
            params.title = params.title + '';
            params.text = params.text + '';
            if (!('needOkBtn' in params)) {
                params.needOkBtn = true;
            }
            if (!('needCancelBtn' in params)) {
                params.needCancelBtn = true;
            }
            mqq.invoke('nav', 'showDialog', params);
        }
    },
    android: function(params, callback) {
        if (mqq.compare('4.8.0') >= 0) {
            params.callback = mqq.callback(callback, true);
            mqq.invoke('ui', 'showDialog', params);
        } else {
            var okCbName = '',
                cancelCbName = '';

            if (callback) {

                okCbName = mqq.callback(function() {
                    callback({
                        button: 0
                    });
                }, true);
                cancelCbName = mqq.callback(function() {
                    callback({
                        button: 1
                    });
                }, true);

                okCbName += '()';
                cancelCbName += '()';
            }
            params.title = params.title + '';
            params.text = params.text + '';
            if (!('needOkBtn' in params)) {
                params.needOkBtn = true;
            }
            if (!('needCancelBtn' in params)) {
                params.needCancelBtn = true;
            }
            mqq.invoke('publicAccount', 'showDialog', params.title, params.text,
                params.needOkBtn, params.needCancelBtn, okCbName, cancelCbName);
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});
// 模块：ui
// 方法名：showTips
// 说明：弹出文本的toast提示，2秒后消失。
// 参数：
// @param {Object} params 
// {String} text 要提示的文字内容 


// 示例：
// mqq.invoke('ui','showTips', {text: 'hello'});


mqq.build('mqq.ui.showTips', {
    iOS: function(params) {

        mqq.invoke('ui', 'showTips', params);
    },
    android: function(params) {

        mqq.invoke('ui', 'showTips', params);
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});
mqq.build('mqq.ui.setLoading', {
    iOS: function(params) {

        if (params) {
            //文档上要求如果visible没有值，不去改变菊花。
            if (params.visible === true) {
                mqq.invoke('nav', 'showLoading');
            } else if (params.visible === false) {
                mqq.invoke('nav', 'hideLoading');
            }

            if (params.color) {
                mqq.invoke('nav', 'setLoadingColor', {
                    'r': params.color[0],
                    'g': params.color[1],
                    'b': params.color[2]
                });
            }
        }
    },
    android: function(params) {
        if ('visible' in params) {
            if (params.visible) {
                mqq.invoke('publicAccount', 'showLoading');
            } else {
                mqq.invoke('publicAccount', 'hideLoading');
            }
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});
mqq.build('mqq.data.getUserInfo', {
    iOS: function(callback) {

        return mqq.invoke('data', 'userInfo', callback);
    },
    android: function(callback) {
        mqq.invoke('data', 'userInfo', {
            callback: mqq.callback(callback)
        });
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});
/**
 批量查询指定应用是否已安装
 @param {Array<String>} schemes 比如['mqq', 'mqqapi']
 @return {Array<Boolean>}
 */

mqq.build('mqq.app.isAppInstalledBatch', {
    iOS: function(schemes, callback) {

        return mqq.invoke('app', 'batchIsInstalled', {
            'schemes': schemes
        }, callback);
    },
    android: function(identifiers, callback) {
        identifiers = identifiers.join('|');

        mqq.invoke('QQApi', 'isAppInstalledBatch', identifiers, function(result) {
            var newResult = [];

            result = (result + '').split('|');
            for (var i = 0; i < result.length; i++) {
                newResult.push(parseInt(result[i]) === 1);
            }

            callback(newResult);
        });
    },
    support: {
        iOS: '4.2',
        android: '4.2'
    }
});
/**
 查询单个应用是否已安装
 @param {String} scheme 比如'mqq'
 @return {Boolean}
 */

mqq.build('mqq.app.isAppInstalled', {
    iOS: function(scheme, callback) {

        return mqq.invoke('app', 'isInstalled', {
            'scheme': scheme
        }, callback);
    },
    android: function(identifier, callback) {
        mqq.invoke('QQApi', 'isAppInstalled', identifier, callback);
    },
    support: {
        iOS: '4.2',
        android: '4.2'
    }
});
/**
 发起购买请求
 pay.pay 是IOS的  iap的支付  和财付通的支付没有关系 
 @param {Object} options
 - {String}  apple_pay_source 调用来源，区分不同的场景，找soapyang 统一定义
 - {int}    [qq_product_id] QQ 商品ID  1 表情类   2 会员  3超级会员
 - {String} [qq_product_name]   QQ 商品ID 可用于显示的名称
 - {String}  app_id 数平支付的id 区分不同产品 目前表情填：1450000122  会员填：1450000299 超级会员：1450000306
 - {String} [pf] 平台来源，$平台-$渠道-$版本-$业务标识  例如：mobile-1234-kjava-$大厅标识 , 业务自定义的
 - {String} [pfkey] 跟平台来源和openkey根据规则生成的一个密钥串。内部应用填pfKey即可，不做校验
 - {String}  product_id 苹果支付的商品ID, 手Q和sdk透传
 - {int}    [product_type]  (0.消费类产品 1.非消费类产品 2.包月+自动续费 3.免费 4.包月+非自动续费)
 - {int}    [quantity] 购买数量，目前填1
 - {int}    [is_deposit_game_coin] 是否是托管游戏币，表情商城目前不是，0
 - {String} [pay_item] 购买明细，业务自己控制，手Q和sdk透传，存在于批价和发货整个流程里,即从批价svr获取的paytoken
 - {String} [var_item] 这里存放业务扩展信息，如tj_plat_id=1~tj_from=vip.gongneng.xxx.xx~provider_id=1~feetype
 @param {String} callback 回调的js函数  callback(int,String)
 回调字段
 - {int}    [result]
 -1   //未知错误
 0  //发货成功
 1  //下订单失败
 2  //支付失败
 3   //发货失败
 4    //网络错误
 5    //登录失败或无效
 6    //用户取消
 7    //用户关闭IAP支付
 -  {String} [message]
 信息+（错误码），在提示给用户信息的同时添加错误码方便定位问题。
 格式如：参数错误（1001）     
 */

mqq.build('mqq.pay.pay', {
    iOS: function(options, callback) {
        var callbackName = callback ? mqq.callback(callback) : null;
        mqq.invoke('pay', 'pay', {
            'params': options,
            'callback': callbackName
        });
    },
    support: {
        iOS: '4.6'
    }
});
/**
客户端的上报接口, 上报到后台根据type进行分发, type需要跟后台约定, 可以联系 mapleliang

 */

mqq.build('mqq.data.pbReport', {
    iOS: function(type, data) {

        mqq.invoke('data', 'pbReport', {
            'type': String(type),
            'data': data
        });
    },
    android: function(type, data) {

        mqq.invoke('publicAccount', 'pbReport', String(type), data);
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});

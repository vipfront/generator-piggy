;(function() {
    // 测速上报类
    var _timePoints = this._timePoints = [Date.now()];
    var noop = function() {};
    _timePoints.mark = function(index, timeVal) {
        if(!_timePoints[index]) {
            _timePoints[index] = timeVal || Date.now();
        }
    };

    this.QzoneApp = {
        fire: noop
    };

    this.JsBridge = {
        callback: noop
    };

    this.Downloader = {
        changeCallbackFunc: noop
    }

    // 添加一个占位符
    if(this.seajs) {
        define(function() {});
    }
}).call(this);

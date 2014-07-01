var chalk = require('chalk');
var fs = require('fs');

// 字体变色
exports.shinning = function(str) {
    return chalk.red(str);
}

// 获取子模块，即当前html目录下所有一级目录
// 没有则返回main
exports.getSubModules = function() {
    var base = './src/html/';
    var modules = fs.readdirSync(base).filter(function(file) {
        return fs.statSync(base + file).isDirectory();
    });

    return modules;
}

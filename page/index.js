'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var utils = require('../lib/utils');
var say = require('../lib/say');

var PageGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');
  },

  askFor: function () {
    var that = this;
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(say());

    var subModules = utils.getSubModules();

    // 询问新页面放到哪个模块下
    var prompts = [
        {
            type: 'input',
            name: 'pageName',
            message: 'Input your Page\'s name.'
        },
        {
            type: 'list',
            name: 'moduleName',
            message: 'Which Sub-Module?',
            choices: subModules
        }
    ];

    this.prompt(prompts, function (props) {
      this.pageName = props.pageName;
      // 直接返回的是数组中的值
      this.moduleName = props.moduleName;

      done();
    }.bind(this));
  },

  files: function () {
    this.template('index.html', 'src/html/<%= moduleName %>/<%= pageName %>.html');
    this.template('index.js', 'src/js/page/<%= moduleName %>/<%= pageName %>.js');
    this.template('index.css', 'src/css/<%= moduleName %>/<%= pageName %>.css');
  }
});

module.exports = PageGenerator;

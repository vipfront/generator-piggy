'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var utils = require('../lib/utils');
var say = require('../lib/say');

var ModuleGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');
  },

  askFor: function () {
    var that = this;
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(say());

    // 询问新页面放到哪个模块下
    var prompts = [
        {
            type: 'input',
            name: 'moduleName',
            message: 'Input your Module\'s name.'
        }
    ];

    this.prompt(prompts, function (props) {
      this.moduleName = props.moduleName;
      var subModules = utils.getSubModules();
      // 判断module是否已经存在
      if(~subModules.indexOf(this.moduleName)) {
          this.log.error('The Module already exists.');
      }

      done();
    }.bind(this));
  },

  files: function () {
    this.mkdir('src/html/' + this.moduleName);
    this.mkdir('src/js/page/' + this.moduleName);
    this.mkdir('src/css/' + this.moduleName);
    this.mkdir('src/img/' + this.moduleName);
    this.log.ok('new module ' + this.moduleName + 'created');
  }
});

module.exports = ModuleGenerator;

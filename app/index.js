'use strict';
var util = require('util');
var utils = require('../lib/utils');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');


var PiggyGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');

    this.on('end', function () {
      if (!this.options['skip-install']) {
        this.installDependencies();
      }
    });
  },

  askFor: function () {
    var that = this;
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Happy Piggy!'));

    var prompts = [
        {
            type: 'input',
            name: 'projName',
            message: '请输入你的应用名称. (' + utils.shinning('默认 [' + that.appname + ']') + ')',
            default: that.appname
        },
        {
            type: 'input',
            name: 'projVersion',
            message: '请输入你的应用版本. (' + utils.shinning('默认 [1.0.0]') + ')',
            default: '1.0.0'
        },

        {
            type: 'confirm',
            name: 'projZepto',
            message: '请选择是否包含Zepto? (' + utils.shinning('默认 [Yes]') + ')',
            default: true
        },
        {
            type: 'checkbox',
            name: 'projQW',
            message: '请选择你需要的QW库版本. (' + utils.shinning('默认 [离线版]') + ')',
            choices: [
                {name: '私有版', value: 'private'},
                {name: '离线版', value: 'offline', checked: true},
                {name: '不用了', value: 'none'}
            ]
        }
    ];

    this.prompt(prompts, function (props) {
      this.projName = props.projName;
      this.projVersion = props.projVersion;
      this.projZepto = props.projZepto;
      this.projQW = props.projQW;

      done();
    }.bind(this));
  },

  // 询问Piggy是在线版或离线版
  askForPiggyEdition: function() {
    var done = this.async();
    var prompts = [
        {
            type: 'checkbox',
            name: 'projPiggyVer',
            message: '请选择你需要的Piggy版本. (' + utils.shinning('默认 [离线版]') + ')',
            choices: [
                {name: '私有版', value: 'private'},
                {name: '离线版', value: 'offline', checked: true},
                {name: '不用了', value: 'none'}
            ]
        },
    ];

    this.prompt(prompts, function (props) {
      this.projPiggyVer = props.projPiggyVer;

      done();
    }.bind(this));
  },

  // 针对在线版Piggy，选择需要的模块
  askForPiggyModule: function() {
    var done = this.async();

    if('private' == this.projPiggyVer) {
        var prompts = [
            // TODO:模块依赖处理
            {
                type: 'checkbox',
                name: 'projModules',
                message: '请选择你需要的Piggy模块. (' + utils.shinning('使用【空格键】选择') + ')',
                choices: [
                    // checked: true will check the choice
                    {name: 'core', value: 'core', disabled: true},
                    {name: 'process', value: 'process', checked: true},
                    {name: 'util', value: 'util'},
                    {name: 'net', value: 'net'},
                ]
            }
        ];

        this.prompt(prompts, function (props) {
          this.projModules = ['core'].concat(props.projModules);

          done();
        }.bind(this));
    } else {
        this.projModules = false;
        done();
    }
  },

  globalNpmTaskPath: function() {
    this.globalNpmTaskPath = __dirname + '/../node_modules/';
  },

  app: function () {
    var that = this;
    this.directory('src');
    this.mkdir('release');

    if(this.projZepto) {
        this.directory('_zepto', 'src/js/zepto');
    }

    if('private' == this.projQW) {
        this.directory('_qw', 'src/js/qw');
    }

    if('private' == this.projPiggyVer) {
        this.projModules.forEach(function(mod) {
            that.copy('_piggy/' + mod + '.js', 'src/js/piggy/' + mod + '.js');
        });
    }

    // copy also handle template
    // template also handle srcPath and destPath template
    // template file don't need prefix underscore
    this.template('_package.json', 'package.json');
    this.template('_Gruntfile.js', 'Gruntfile.js');
  },

  projectfiles: function () {
  }
});

module.exports = PiggyGenerator;

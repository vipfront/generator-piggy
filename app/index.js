'use strict';
var util = require('util');
var utils = require('./lib/utils');
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
    this.log(yosay('Thank Yor For Using Piggy!'));

    var prompts = [
        {
            type: 'input',
            name: 'projName',
            message: 'What\'s your App\'s name?(' + utils.shinning('default [' + that.appname + ']') + ')',
            default: that.appname
        },
        {
            type: 'input',
            name: 'projVersion',
            message: 'What\'s your App\'s version?(' + utils.shinning('default [1.0.0]') + ')',
            default: '1.0.0'
        },
        {
            type: 'checkbox',
            name: 'projModules',
            message: 'Please select your Piggy modules?(' + utils.shinning('use [SPACE] to check/uncheck') + ')',
            choices: [
                {name: 'core', value: 'core', checked: true},
                {name: 'process', value: 'module2'},
                {name: 'util', value: 'module3'},
                {name: 'net', value: 'module4'},
            ],
        },
        {
            type: 'confirm',
            name: 'projZepto',
            message: 'Need Zepto?(' + utils.shinning('default [Yes]') + ')',
            default: true
        },
        {
            type: 'confirm',
            name: 'projQW',
            message: 'Need QW?(' + utils.shinning('default [Yes]') + ')',
            default: true
        },
    ];

    this.prompt(prompts, function (props) {
      this.projName = props.projName;
      this.projVersion = props.projVersion;
      this.prpjZepto = props.projZepto;
      this.projQW = props.projQW;
      this.projModules = props.projModules;

      done();
    }.bind(this));
  },

  app: function () {
    this.mkdir('html');
    this.mkdir('js');
    this.mkdir('css');
    this.mkdir('img');

    this.template('_package.json', 'package.json');
  },

  projectfiles: function () {
  }
});

module.exports = PiggyGenerator;

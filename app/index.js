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
    this.log(yosay('Happy Piggy!'));

    var prompts = [
        {
            type: 'input',
            name: 'projName',
            message: 'Input your App\'s name. (' + utils.shinning('default [' + that.appname + ']') + ')',
            default: that.appname
        },
        {
            type: 'input',
            name: 'projVersion',
            message: 'Input your App\'s version. (' + utils.shinning('default [1.0.0]') + ')',
            default: '1.0.0'
        },
        {
            type: 'checkbox',
            name: 'projModules',
            message: 'Select your Piggy modules. (' + utils.shinning('use [SPACE] to check/uncheck') + ')',
            choices: [
                // checked: true will check the choice
                {name: 'core', value: 'core', disabled: true},
                {name: 'process', value: 'process', checked: true},
                {name: 'util', value: 'util'},
                {name: 'net', value: 'net'},
            ]
        },
        {
            type: 'confirm',
            name: 'projZepto',
            message: 'Include Zepto?(' + utils.shinning('default [Yes]') + ')',
            default: true
        },
        {
            type: 'confirm',
            name: 'projQW',
            message: 'Include QW?(' + utils.shinning('default [Yes]') + ')',
            default: true
        },
    ];

    this.prompt(prompts, function (props) {
      this.projName = props.projName;
      this.projVersion = props.projVersion;
      this.projZepto = props.projZepto;
      this.projQW = props.projQW;
      // core is needed
      // TODO: add dependencies support
      this.projModules = ['core'].concat(props.projModules);

      done();
    }.bind(this));
  },

  app: function () {
    var that = this;
    this.directory('src');
    this.mkdir('release');

    if(this.projZepto) {
        this.directory('_zepto', 'src/js/zepto');
    }

    if(this.projQW) {
        this.directory('_qw', 'src/js/qw');
    }

    this.projModules.forEach(function(mod) {
        that.copy('_piggy/' + mod + '.js', 'src/js/piggy/' + mod + '.js');
    });

    // copy also handle template
    // template also handle srcPath and destPath template
    // template file don't need prefix underscore
    this.template('package.json', 'package.json');
    this.template('Gruntfile.json', 'Gruntfile.js');
  },

  projectfiles: function () {
  }
});

module.exports = PiggyGenerator;

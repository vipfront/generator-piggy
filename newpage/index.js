'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

var NewpageGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');
  },

  askFor: function () {
    var that = this;
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Happy Piggy!'));

    var prompts = [
        {
            type: 'input',
            name: 'pageName',
            message: 'Input your Page\'s name.'
        }
    ];

    this.prompt(prompts, function (props) {
      this.pageName = props.pageName;

      done();
    }.bind(this));
  },

  files: function () {
    this.template('_index.html', 'src/html/<%= pageName %>.html');
    this.template('_index.js', 'src/js/<%= pageName %>.js');
  }
});

module.exports = NewpageGenerator;

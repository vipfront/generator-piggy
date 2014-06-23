'use strict';
var util = require('util');
var yeoman = require('yeoman-generator');


var NewpageGenerator = yeoman.generators.NamedBase.extend({
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

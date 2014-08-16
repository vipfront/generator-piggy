/**
 *
 */
var path = require('path');

module.exports = function(grunt) {
    // 加载findup-grunt-npmtasks插件，实现插件共用
    require('findup-grunt-npmtasks')(grunt, {
        path: ['<%= globalNpmTaskPath %>']
    });

    grunt.initConfig({
        // jshint
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true
            },
            js: {
                src: ['src/js/page/**/*.js']
            }
        },
        // 将普通模块翻译为CMD模块
        transport: {
            options: {
                debug: false
            },
            all: {
                expand: true,
                debug: false,
                cwd: 'src/js/',
                src: ['**/*.js', '!sea/*.js'],
                dest: './_tmp1/js/'
            }
        },
        // 压缩CSS
        cssmin: {
            css: {
                expand: true,
                cwd: 'src/css/',
                src: ['**/*.css'],
                dest: 'release/css/'
            }
        },
        // 压缩JS
        uglify: {
            seajs: {
                expand: true,
                cwd: 'src/js/',
                src: ['sea/*.js'],
                dest: 'release/js/'
            },
            js: {
                expand: true,
                cwd: './_tmp1/js/',
                src: ['**/*.js'],
                dest: 'release/js/'
            }
        },
        // 将html和图片拷贝到release目录
        copy: {
            html: {
                expand: true,
                cwd: 'src/html/',
                src: ['**/*.html'],
                dest: 'release/html/'
            },
            img: {
                expand: true,
                cwd: 'src/img/',
                src: ['**/*.*'],
                dest: 'release/img/'
            }
        },
        // inline处理
        inline: {
            html: {
                src: ['release/html/**/*.html']
            }
        },
        // 执行HTML校验
        htmlhint: {
            all: {
                options: {
                    'tagname-lowercase': true,
                    'attr-lowercase': true,
                    'attr-value-double-quotes': true,
                    'doctype-first': true,
                    'tag-pair': true,
                    'spec-char-escape': true,
                    'id-unique': true,
                    'src-not-empty': true,
                },
                src: ['release/html/**/*.html']
            }
        },
        // 打离线包
        // 清除临时目录
        clean: {
            pre: {
                src: ['./_tmp*', 'release/']
            },
            post: {
                src: ['./_tmp*']
            }
        }
    });

    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-htmlhint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-inline');

    // load you own npm tasks here
    //
    // grunt.loadNpmTasks('your-task');

    grunt.registerTask('default', ['clean:pre', 'transport', 'cssmin', 'uglify', 'copy', 'inline', 'htmlhint', 'clean:post']);
    //grunt.registerTask('jshint', ['jshint']);
    grunt.registerTask('release', ['compress']);
}

/**
 *
 */
module.exports = function(grunt) {
    // 加载findup-grunt-npmtasks插件，实现插件共用
    require('findup-grunt-npmtasks')(grunt, {
        path: ['<%= globalNpmTaskPath %>']
    });

    grunt.initConfig({
        // jshint
        jshint: {
            options: {
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
            // 非页面相关的模块transport到临时目录
            // sea.js不参与构建
            // 整个项目除sea.js外，其他的js文件都必须有define调用
            // 没有define调用的文件不会被transport
            notpage: {
                expand: true,
                cwd: 'src/js/',
                src: ['**/*.js', '!lib/sea.js', '!page/**/*.js'],
                dest: '_tmp/transport_notpage/'
            },
            // 页面相关的模块直接transport到临时目录
            page: {
                expand: true,
                cwd: 'src/js/',
                src: ['page/**/*.js'],
                dest: '_tmp/transport_page/'
            }
        },
        // 压缩CSS
        // 直接压到release目录
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
                src: ['lib/sea.js'],
                dest: '_tmp/uglify_seajs/'
            },
            notpage: {
                expand: true,
                cwd: '_tmp/transport_notpage/',
                src: ['**/*.js'],
                dest: '_tmp/uglify_notpage/'
            },
            page: {
                expand: true,
                cwd: '_tmp/transport_page/',
                src: ['**/*.js'],
                dest: 'release/js/'
            }
        },
        // 拼接代码
        concat: {
            js: {
                src: ['_tmp/uglify_seajs/lib/sea.js', '_tmp/uglify_notpage/**/*.js'],
                dest: 'release/js/package.js'
            }
        },
        // 将除css、js外的其他目录都拷贝到release下
        // 隐藏目录不会复制
        copy: {
            all: {
                expand: true,
                cwd: 'src',
                src: ['**/*.*', '!js/**/*.*', '!css/**/*.*'],
                dest: 'release/'
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
                src: ['_tmp', 'release']
            },
            post: {
                src: ['_tmp']
            }
        }
    });

    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-contrib-concat');
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

    grunt.registerTask('default', ['clean:pre', 'transport', 'cssmin', 'uglify', 'concat', 'copy', 'inline', 'htmlhint', 'clean:post']);
    //grunt.registerTask('jshint', ['jshint']);
    grunt.registerTask('release', ['compress']);
}

var webpack = require("/Users/wen/Downloads/karma-webpack-example/node_modules/webpack");
module.exports = function (config) {
    config.set({

        files: [
            // all files ending in "test"

            'test/chrome/*.js'
            // each file acts as entry point for the webpack configuration
        ],

        // frameworks to use
        frameworks: ['mocha'],

        preprocessors: {
            // only specify one entry point
            // and require all tests in there
            'test/**/*.js': [  'webpack',  'coverage' ],

        },

        reporters: ['progress', 'coverage'],


        coverageReporter: {

            dir: 'build/coverage/',
            reporters: [
                {type: 'html'},
                {type: 'text'},
                {type: 'text-summary'}
            ]
        },

        webpack: {
            // webpack configuration
            module: {
                loaders: [{
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    query: {
                        presets: ['es2015'],
                    }
                }],

            },

        },

        webpackMiddleware: {
            // webpack-dev-middleware configuration
            noInfo: true
        },

        plugins: [
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/karma-webpack"),
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/istanbul-instrumenter-loader"),
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/karma-mocha"),
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/karma-coverage"),
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/karma-phantomjs-launcher"),
            require("/Users/wen/Downloads/karma-webpack-example/node_modules/karma-spec-reporter")
        ],

        browsers: ['PhantomJS']
    });
};
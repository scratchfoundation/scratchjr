var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    devtool: 'source-map',
    entry: {
        app: './src/entry/app.js'
    },
    output: {
        path: __dirname + '/src/build/bundles',
        filename: '[name].bundle.js'
    },
    performance: {
        hints: false
    },
    watchOptions: {
        ignored: ["node_modules", "src/build/**/*"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: /node_modules/,
                loaders: ['strip-sourcemap-loader']
            },
            {
                loader: 'babel-loader',
                exclude: /node_modules/,
                test: /\.jsx?$/,
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new WebpackNotifierPlugin({
            title: "ScratchJr",
            alwaysNotify: true
        })
    ]
};

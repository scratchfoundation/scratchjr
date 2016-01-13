module.exports = {
    devtool: 'source-map',
    entry: {
        index: './src/entry/index.js',
        editor: './src/entry/editor.js',
        home: './src/entry/home.js'
    },
    output: {
        path: './src/build/bundles',
        filename: '[name].bundle.js'
    },
    module: {
        loaders: [
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
    }
};

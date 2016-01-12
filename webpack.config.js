module.exports = {
    entry: {
        index: './src/entry/index.js',
        editor: './src/entry/editor.js'
    },
    output: {
        path: './src/build/bundles',
        filename: '[name].bundle.js'
    },
    module: {
        loaders: [
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

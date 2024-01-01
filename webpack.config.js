const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/manifest.json', to: 'manifest.json' },
                { from: 'src/popup/popup.html', to: 'popup.html' },
                { from: 'src/images', to: 'images' }
            ]
        })
    ],
    entry: {
        background: './src/background/entry_points/chrome.js',
        popup: './src/popup/popup.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    }
};
2
var path = require('path');
var webpack = require('webpack');

var SRC = path.join(__dirname, 'src/');

module.exports = {
    entry: SRC,
    output: {
        publicPath: 'src/js/',
        path: __dirname + '/src/js',
        filename: 'app.bundle.js'
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.(jpg|png)$/,
            use: ['file-loader?name=img/[name].[ext]', {
                loader: 'image-webpack-loader',
                query: {
                    mozjpeg: {
                        progressive: true,
                    },
                    gifsicle: {
                        interlaced: false,
                    },
                    optipng: {
                        optimizationLevel: 4,
                    },
                    pngquant: {
                        quality: '75-90',
                        speed: 3,
                    },
                },
            }]

        }, {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: 'url-loader?limit=10000&minetype=application/font-woff'
        }, {
            test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: 'file-loader'
        }, {
            test: /\.svg(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: ['file-loader', {
                loader: 'image-webpack-loader',
                query: {
                    mozjpeg: {
                        progressive: true,
                    },
                    gifsicle: {
                        interlaced: false,
                    },
                    optipng: {
                        optimizationLevel: 4,
                    },
                    pngquant: {
                        quality: '75-90',
                        speed: 3,
                    },
                },
            }]
        }]
    },
    node: {
        fs: 'empty'
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Tether: 'tether',
            'window.Tether': 'tether',
            Tooltip: 'exports?Tooltip!bootstrap/js/dist/tooltip',
            Alert: 'exports?Alert!bootstrap/js/dist/alert',
            Button: 'exports?Button!bootstrap/js/dist/button',
            Carousel: 'exports?Carousel!bootstrap/js/dist/carousel',
            Collapse: 'exports?Collapse!bootstrap/js/dist/collapse',
            Dropdown: 'exports?Dropdown!bootstrap/js/dist/dropdown',
            Modal: 'exports?Modal!bootstrap/js/dist/modal',
            Popover: 'exports?Popover!bootstrap/js/dist/popover',
            Scrollspy: 'exports?Scrollspy!bootstrap/js/dist/scrollspy',
            Tab: 'exports?Tab!bootstrap/js/dist/tab',
            Tooltip: 'exports?Tooltip!bootstrap/js/dist/tooltip',
            Util: 'exports?Util!bootstrap/js/dist/util'
        })

       
    ]
};

var path = require("path");
var webpack = require("webpack");

var SRC = path.join(__dirname, 'src/');

module.exports = {
    entry: SRC,
    output: {
        publicPath: "src/js/",
        path: './src/js',
        filename: 'app.bundle.js'
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loaders: ['style', 'css']
        }, {
            test: /\.(jpg|png)$/,
            loaders: ['file?name=img/[name].[ext]', 'image-webpack?{optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}']
                //query: {
                //    name: 'img/[name].[ext]'
                //}

        }, {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "url-loader?limit=10000&minetype=application/font-woff"
        }, {
            test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "file-loader"
        }, {
            test: /\.svg(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loaders: ['file-loader', 'image-webpack?{optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}']
        }]
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            Tether: "tether",
            "window.Tether": "tether",
            Tooltip: "exports?Tooltip!bootstrap/js/dist/tooltip",
            Alert: "exports?Alert!bootstrap/js/dist/alert",
            Button: "exports?Button!bootstrap/js/dist/button",
            Carousel: "exports?Carousel!bootstrap/js/dist/carousel",
            Collapse: "exports?Collapse!bootstrap/js/dist/collapse",
            Dropdown: "exports?Dropdown!bootstrap/js/dist/dropdown",
            Modal: "exports?Modal!bootstrap/js/dist/modal",
            Popover: "exports?Popover!bootstrap/js/dist/popover",
            Scrollspy: "exports?Scrollspy!bootstrap/js/dist/scrollspy",
            Tab: "exports?Tab!bootstrap/js/dist/tab",
            Tooltip: "exports?Tooltip!bootstrap/js/dist/tooltip",
            Util: "exports?Util!bootstrap/js/dist/util",
        }),

        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};

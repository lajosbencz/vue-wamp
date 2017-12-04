
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractCSS = new ExtractTextPlugin('[name].css');

const config = {
    entry: {
        vendor: ['jquery', 'bootstrap'],
        client: './example/client.js',
        server: './example/server.js'
    },
    output: {
        path: path.resolve(__dirname, 'example', 'dist'),
        filename: process.env.NODE_ENV == 'production' ? '[name].[chunkhash].js' : '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader'
            },
            /*
            {
                test: /\.css$/,
                loader: extractCSS.extract(['css-loader', 'postcss-loader'])
            },
            */
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.s[ac]ss$/,
                use: extractCSS.extract({
                    fallback: 'style-loader',
                    use: 'css-loader!sass-loader'
                })
            },
            {
                test: /\.(woff2?|ttf|eot|svg)$/,
                loader: 'url-loader?limit=10000'
            },
            {
                test: /bootstrap\/dist\/js\/umd\//,
                loader: 'imports?jQuery=jquery'
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            jquery: 'jquery'
        }),
      /*
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendor', 'manifest'],
            minChunks: 2,
        }),
        */
        //new webpack.optimize.UglifyJsPlugin(),
        new HtmlWebpackPlugin({template: './example/index.html'}),
        extractCSS
    ],
    resolve: {
        alias: {
            jquery: "jquery/src/jquery",
            'vue$': 'vue/dist/vue.common.js'
        }
    },
    devServer: {
        //contentBase: path.join(__dirname, 'example', 'dist'),
        port: 9000,
        compress: false,
        inline: true,
        hot: true
    },
    devtool: 'source-map'
};

module.exports = config;
/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { merge } = require('webpack-merge');

const baseConfig = {
    //stats: 'verbose',
    mode: "development",
    entry: './src/main.js',
    module: {
      rules: [
        {
          exclude: /node_modules/,
        },
        {
          test: /\.(s(a|c)ss)$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
        },
        {
          test: /\.svg$/i,
          use: ['svg-inline-loader']
        }
      ]
    },
    resolve: {
      alias: {
        '@spotfire-mod-common': path.resolve(__dirname, 'external/spotfire-mod-common3/js'),
      },
      extensions: [".tsx", ".ts", ".js", ".mjs"]
    },  
    plugins: [
      new CopyPlugin({ patterns: [{ from: "static" }] }),
      new MiniCssExtractPlugin(),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devtool: "inline-source-map"
};

const developmentConfig = {
  plugins: [
      new webpack.DefinePlugin({
        'process.env.BUILD_TYPE': JSON.stringify('development')
    })
  ]
};

const productionConfig = {
  plugins: [
      new webpack.DefinePlugin({
        'process.env.BUILD_TYPE': JSON.stringify('production')
      })
  ]
};

module.exports = (env) => {
  switch (env.BUILD_TYPE) {
      case 'development':
          return merge(baseConfig, developmentConfig);
      case 'production':
          return merge(baseConfig, productionConfig);
      default:
          break;
  }
};
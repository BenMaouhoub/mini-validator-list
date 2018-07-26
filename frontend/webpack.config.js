const WriteFilePlugin = require("write-file-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const webpack = require("webpack");

module.exports = {
  entry: ["react-hot-loader/patch", "./src/index.js"],
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "bundle.js",
    hotUpdateChunkFilename: "hot/hot-update.js",
    hotUpdateMainFilename: "hot/hot-update.json"
  },
  devtool: "source-map",
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx", ".json", ".svg"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "babel-loader"
          },
          {
            loader: "react-svg-loader",
            options: {
              jsx: true // true outputs JSX tags
            }
          }
        ]
      }
    ]
  },
  externals: {
    react: "React",
    "react-dom": "ReactDOM"
  },
  plugins: [
    new CleanWebpackPlugin(["dist/hot"]),
    new webpack.HotModuleReplacementPlugin(),
    new WriteFilePlugin()
  ],
  devServer: {
    contentBase: "./dist",
    hot: true
  }
};

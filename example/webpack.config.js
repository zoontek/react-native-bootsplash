// https://necolas.github.io/react-native-web/docs/multi-platform/#compiling-and-bundling
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const fromRoot = (_) => path.resolve(__dirname, _);

module.exports = {
  mode: "development",
  entry: fromRoot("index.js"),
  output: {
    path: fromRoot("dist"),
    filename: "bundle.web.js",
  },
  devServer: {
    static: { directory: fromRoot("dist") },
    devMiddleware: { publicPath: "/" },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: fromRoot("index.html"),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: { loader: "babel-loader" },
        include: [fromRoot("index.js"), fromRoot("src")],
      },
      {
        test: /\.(jpe?g|png|svg)$/,
        use: {
          loader: "url-loader",
          options: { name: "[name].[ext]", esModule: false },
        },
      },
    ],
  },
  resolve: {
    alias: { "react-native$": "react-native-web" },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
      .map((extension) => [".web" + extension, extension])
      .flat(),
  },
};

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const fromRoot = (_) => path.resolve(__dirname, _);
const nodeModules = fromRoot("node_modules");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
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
      template: fromRoot("public/index.html"),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: { loader: "babel-loader" },
        include: [fromRoot("index.js"), fromRoot("src"), fromRoot("../src")],
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: "react-native-web-image-loader",
        options: { esModule: false, scalings: { "@2x": 2, "@3x": 3 } },
      },
      {
        test: /\.(svg)$/,
        use: {
          loader: "url-loader",
          options: { esModule: false },
        },
      },
    ],
  },
  resolve: {
    alias: {
      react: path.join(nodeModules, "react"),
      "react-dom": path.join(nodeModules, "react-dom"),
      "react-native$": "react-native-web",
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
      .map((extension) => [".web" + extension, extension])
      .flat(),
  },
};

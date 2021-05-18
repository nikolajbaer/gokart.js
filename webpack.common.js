const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = { 
  entry: './examples/src/index.jsx', 
  output: { 
    path: path.resolve(__dirname,'dist'), 
    filename: 'static/index_bundle.js?' + process.env.SOURCE_VERSION,
  }, 
  module: {
    rules: [
        {
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
        },
        {
            test: /\.(png|svg|jpg|jpeg|gif|pdf|glb|mp3|ogg)$/,
            use: [{
                loader: 'file-loader',
                options: {
                  outputPath: 'static'
                }
            }]
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.wasm$/,
          type: 'javascript/auto',
          loader: 'file-loader',
        },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'Output Management',
      template: 'examples/src/index.html',
      inject: true,
    }),
  ]
}

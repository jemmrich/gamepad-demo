const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,  // Note: The backslash needs to be escaped in the actual file
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: {
      directory: path.join(__dirname, './'),
    },
    compress: true,
    host: '0.0.0.0',  // This allows connections from any IP address
    allowedHosts: 'all',  // This allows requests from any domain
    port: 8000
  }
};
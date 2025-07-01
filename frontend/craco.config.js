module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 添加全局变量来定义console.info
      webpackConfig.plugins.push(
        new webpackConfig.constructor.DefinePlugin({
          'console.info': 'console.log',
        })
      );
      
      return webpackConfig;
    },
  },
}; 
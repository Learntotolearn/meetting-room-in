// 浏览器兼容性 polyfills

// Console polyfill for older browsers
(function() {
  if (typeof console === 'undefined') {
    window.console = {};
  }
  
  const consoleMethods = ['info', 'warn', 'error', 'debug'];
  
  consoleMethods.forEach(method => {
    if (typeof console[method] === 'undefined') {
      console[method] = function() {
        if (console.log) {
          console.log.apply(console, arguments);
        }
      };
    }
  });
})();

// 其他可能需要的 polyfills 可以在这里添加 
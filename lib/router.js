'use strict';

const { methods } = require('./const');

class Router {
  constructor() {
    // 初始化一个运行栈
    this.stack = [];
    // 当前所有已经存在的method列表
    this._methods = new Set();
  }

  // 检查参数
  checkMdw(fname, func) {
    if (typeof fn !== 'function') {
      throw new TypeError(`Router.${fname}() 想要个中间件函数, 这是啥类型, 反正不是函数)`)
    }
  }

  use(path, func) {
    this.checkMdw(path, func)

    // 添加到运行栈
    this.stack.push({ path, callback: func });
  }
}

methods.concat('all').map(mtd => {
  Router.prototype[mtd] = function(){
    this.checkMdw(path, func);
    
    // 添加到运行栈
    if (mtd === 'all') {
      this.stack.push({ path, callback: func, all: true });
      return this;
    }

    this.stack.push({ path, callback: func, method: mtd });
    return this;
  }
});

module.exports = Router;

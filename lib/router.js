'use strict';

const { methods } = require('./const');

class Router {
  constructor() {
    // 初始化一个运行栈
    this._stack = [];
    // 当前所有已经存在的method列表
    this._methods = new Set();
  }

  // 检查参数
  checkMdw(fname, func) {
    if (typeof func !== 'function') {
      throw new TypeError(`Router.${fname}() 想要个中间件函数, 这是啥类型, 反正不是函数)`)
    }
  }

  use(path, func) {
    this.checkMdw('use', func)

    // 添加到运行栈
    this._stack.push({ path, callback: func, method: null });
  }

  // 匹配
  matchLayer(layer = {}) {
    const { method = '', url = '/' } = this.req;
    const lsMethod = method.toLocaleLowerCase();
    let mtdMatched = false;
    // 方法匹配
    if (!layer.all && (!layer.method || layer.method === lsMethod)) {
      mtdMatched = true;
    }
    // 路径匹配
    const pathMatched = layer.path === url;
    if (mtdMatched && pathMatched) {
      return true;
    }
    return false;
  }


  handle(req, res) {
    const stack = this._stack;
    this.req = req;
    this.res = res;
    const stackLen = stack.length;
    let idx = 0;
    const next = function(err) {
      if (idx >= stackLen) {
        return;
      }

      let layer = null;
      while (idx < stackLen) {
        layer = stack[idx++];
        if (layer) {
          break;
        }
        const isMatch = this.matchLayer(layer);
        if (isMatch) {
          continue;
        }
      }
      console.log(layer)
      layer.callback.call(this, req, res, next);
    }

    next();
  }
}

methods.concat('all').map(mtd => {
  Router.prototype[mtd] = function(path, func){
    this.checkMdw(mtd, func);
    
    // 添加到运行栈
    if (mtd === 'all') {
      this._stack.push({ path, callback: func, all: true });
      return this;
    }

    this._stack.push({ path, callback: func, method: mtd });
    return this;
  }
});

module.exports = Router;

'use strict';

const { methods } = require('./const');

class Router {
  constructor() {
    // 初始化一个运行栈
    this._stack = [];
    // 当前所有已经存在的method列表
    this._methods = new Set();
  }

  // 结束
  done(error) {
    if (!error) {
      return this.res.end();
    }
    return this.error(error);
  }

  // 默认错误函数
  error(err) {
    const res = this.res;
    let stack = err || '';
    if (!(err instanceof Error)) {
      return this.done();
    }
    stack = err.stack || message;
    const code = err.code || 500;
    // res.statusCode = 500;
    res.writeHeader(code, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(stack || message);
  }

  // 捕获错误
  errorHandle(error, layer, next) {
    const fn = layer.callback;
    // 参数为 4 个就认为是捕获错误函数
    if (fn.length !== 4) {
      return next(error);
    }

    try {
      fn(error, this.req, this.res, next);
    } catch (err) {
      next(err);
    }
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
    if (layer.all || !layer.method) {
      // all || 没有方法
      mtdMatched = true;
    } else if (!layer.all && layer.method === lsMethod) {
      // !all && 方法匹配
      mtdMatched = true;
    }
    // 路径匹配
    const pathMatched = url.indexOf(layer.path) === 0;
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
    const next = (err) => {
      const error = err || '';
      if (idx >= stackLen) {
        return this.done(error);
      }

      let layer = null;
      while (idx < stackLen) {
        layer = stack[idx++];
        if (!layer) {
          layer = null;
          continue;
        }
        // 有错误, 略过正常执行
        if (error) {
          return this.errorHandle(error, layer, next);
        }
        const isMatch = this.matchLayer(layer);
        if (isMatch) {
          break;
        }
        // 初始化
        layer = null;
      }

      if (!layer) {
        return this.done(error);
      }
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

    // 启用方法
    this._methods.add(mtd);
    this._stack.push({ path, callback: func, method: mtd });
    return this;
  }
});

module.exports = Router;

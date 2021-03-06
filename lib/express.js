'use strict';

const http = require('http');
const Router = require('./router');
const { methods } = require('./const');

class Express {
  constructor() {
    this._router = null;
    this.settings = {};
  }

  set(...args) {
    const [key, value] = args;
    if (args.length === 1) {
      return this.settings[key];
    }

    this.settings[key] = value;
    return this;
  }

  // 懒加载router对象(如不处理path中间件), 节省 V8 内存
  lazyRouter() {
    if (this._router) {
      return this;
    }
    this._router = new Router();
    return this;
  }

  // 统一挂载函数
  generaterMdwFunc(fname, path = '/', cbList = []) {
    if (!cbList.length) {
      throw new TypeError(`app.${fname}() 想要一个中间件函数啊!`);
    }

    // 加载一个 router
    this.lazyRouter();

    cbList.map(f => {
      // 不是中间件
      if (!f) {
        return;
      }

      // 开始挂载中间件
      this._router[fname](path, f);
    });
  }

  use(...args) {
    // 取第一个参数
    const firstArg = args[0];
    // 出发url路径
    let path = '/';
    // 定义中间件取值偏移量
    let offset = 0;

    // 如果不在
    if (typeof firstArg !== 'function') {
      path = firstArg;
      offset = 1;
    }

    // 取值
    const fns = args.slice(offset);

    // 添加中间件
    this.generaterMdwFunc('use', path, fns);

    return this;
  }

  handle(req, res) {
    if (!this._router) {
      return res.end();
    }

    return this._router.handle(req, res);
  }

  callback() {
    return (req, res) => {
      // send
      res.send = (body) => {
        body = body || '';
  
        // buffer
        if (Buffer.isBuffer(body)) {
          res.setHeader('Content-Type', 'application/octet-stream');
          return res.end(body.toString());
        }
  
        if (typeof body === 'object') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(body));
        }
  
        // 字符串
        body = String(body);
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        return res.end(body);
      }
  
      // json
      res.json = (body) => {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(body));
      };
  
      return this.handle(req, res);
    }
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }
}

methods.concat('all').map(mtd => {
  Express.prototype[mtd] = function(...args) {
    if (mtd === 'get' && args.length === 1) {
      return this.set(args[0]);
    }

    // 取值
    const [path, ...fns] = args;

    // 添加中间件
    this.generaterMdwFunc(mtd, path, fns);

    return this;
  }
});

module.exports = () => new Express();

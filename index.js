
// const http = require('http');
const express = require('./lib/express');

// 本次 http 请求的实例
const app = express();

app.use((req, res, next) => {
  const { method = '', url = '/' } = req;
  console.log(`${method} ${url}`)
  next();
});

app.get('/favicon.ico', (req, res, next) => {
  console.log('请求logo');
  // res.statusCode = 404;
  res.writeHeader(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end();
});

app.use((req, res, next) => {
  // 假设在处理 cookie
  console.log('处理 cookie ...');
  req.cookie = {
    userId: 'abc123',
  }
  next();
});

app.use('/api', (req, res, next) => {
  console.log('处理 /api 路由');
  next();
});

app.get('/api', (req, res, next) => {
  console.log('GET /api 路由');
  next();
});

// 模拟登录验证
function loginCheck(req, res, next) {
  setTimeout(() => {
    console.log('模拟登陆成功');
    next('a');
  });
}

app.get('/api/getCookie', loginCheck, (req, res, next) => {
  console.log('GET /api/getCookie');
  res.json({
    success: true,
    data: req.cookie,
  });
});

// 每找到路由
app.use((req, res, next) => {
  next('你这啥啊，也没这路由啊!');
});

// 捕获错误
app.use((err, req, res, next) => {
  res.writeHeader(500, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>无法访问此网站</h1>');
})

app.listen(8000, () => {
  console.log('server is running on port 8000');
});

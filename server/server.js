
var args = process.argv;

const PORT = args.length > 2 ? parseInt(args[2]) : 8080;

var fs = require('fs');
var http = require('http');
var path = require('path');

// WebSocket handler
const WebSocket = require('ws');

const LedConnection = require('./ledconnection.js');

var wss = new WebSocket.Server({
  noServer: true
});

wss.on('connection', function(socket) {
  LedConnection.scanned = function(ip) {
    socket.send(JSON.stringify({
      type: 'scan-result',
      ip: ip
    }));
  };

  LedConnection.get = function(msg) {
    socket.send(JSON.stringify(Object.assign({
      type: 'get'
    }, msg)));
  }

  socket.on('message', function(data) {
    var msg = JSON.parse(data);

    switch (msg.type) {
      case 'scan':
        LedConnection.scan(msg.ip);
        break;

      case 'set-ip':
        LedConnection.set_ip(msg.ip);
        break;

      case 'set':
        LedConnection.set(msg);
        break;
    }
  });
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript'
};

// Static file server
var server = http.createServer(function(req, res) {
  var url = req.url;
  if (url === "/")
    url = "/index.html";

  var resolvedBase = path.resolve('./static');
  var safeSuffix = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
  var fileLoc = path.join(resolvedBase, safeSuffix);

  fs.readFile(fileLoc, function(err, data) {
    if (err) {
      res.writeHead(404, 'Not Found');
      res.write('404: File Not Found!');
      return res.end();
    }

    var ext = path.extname(fileLoc);

    res.writeHead(200, {'Content-Type': MIME_TYPES[ext] || ""});
    res.write(data);

    return res.end();
  });
}).listen(PORT).on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });
});

console.log("Started webserver on port " + PORT);


const dgram = require('dgram');

const dserver = dgram.createSocket('udp4');

dserver.on('error', (err) => {
  console.log(`Server error: ${err.stack}`);
  dserver.close();
});

dserver.on('message', (msg, rinfo) => {});

dserver.on('listening', () => {
  const address = dserver.address();
  console.log(`Server listening on ${address.address}:${address.port}`);
});

dserver.bind();

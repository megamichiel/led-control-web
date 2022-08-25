const d_sock = require('dgram').createSocket('udp4');
const scanPacket = Buffer.from([0, 1, 0]);

const devicePort = 55420;

current_ip = '';

response = {
  scanned: function(ip) {},
  get: function(msg) {},
  
  scan: function(ip) {
    d_sock.send(scanPacket, devicePort, ip);
  },
  set_ip: function(ip) {
    current_ip = ip;
    d_sock.send(Buffer.from([0, 1, 2]), 0, 3, devicePort, ip);
  },
  set: function(msg) {
    var changed = 0;
    var payload = [];
    
    if ("bright" in msg) {
      changed |= 1;
      payload.push(parseInt(msg.bright));
    }
    
    if ("fade" in msg) {
      changed |= 2;
      payload.push(msg.fade >> 8);
      payload.push(msg.fade & 0xFF);
    }
    
    var options = [ "h", "s", "v" ];
    for (var i in options) {
      if (options[i] in msg && msg[options[i]].length > 0) {
        var v = msg[options[i]];
        changed |= 4 << i;
        payload.push(v[0] == '.' ? 1 : 0);
        payload = payload.concat([...Buffer.from(v[0] == '.' ? v.substring(1) : v)]);
        payload.push(0);
      }
    }
    var pLength = payload.length + 2; // Total packet length
    var payload = [pLength >> 8, pLength & 0xFF, 1, changed].concat(payload);

    var buffer = Buffer.from(payload);

//     console.log("Sending", msg, buffer);
    
    d_sock.send(buffer, 0, buffer.length, devicePort, current_ip);
  }
};

d_sock.on('message', (msg, rinfo) => {
  if (msg.equals(scanPacket)) {
    response.scanned(rinfo.address);
    return;
  }

  var length = msg.length;
  
  for (var i = 0; i < length; ) {
    var packetLen = msg[i++] << 8 | msg[i++];
    var packetId = msg[i++];
    if (packetId === 2) {
      var led_count = msg[i++] << 8 | msg[i++];
      var bright = msg[i++];
      var fade = msg[i++] << 8 | msg[i++];
      var colors = [];
      for (var x = 0; x < 3; ++x) {
          colors.push((msg[i++] != 0 ? '.' : '') + msg.subarray(i + 1, i + 1 + msg[i]).toString());
          i += 1 + msg[i];
      }

      response.get({
          led_count: led_count, brightness: bright, fade: fade,
          h: colors[0], s: colors[1], v: colors[2]
      });
    }
  }
});

module.exports = response;

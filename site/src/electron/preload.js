const { ipcRenderer } = require('electron');

process.once('loaded', () => {
  window.addEventListener('message', event => {
    const message = event.data;

    if (['set', 'set-ip', 'scan'].includes(message.type)) {
      ipcRenderer.send(message.type, message);
    }
  });
  
  let events = [ 'get', 'scan-result' ];
  
  for (var i in events) {
    let e = events[i];
    ipcRenderer.on(e, (event, arg) => {
      window.postMessage(Object.assign({ type: e }, arg), '*');
    });
  }
});

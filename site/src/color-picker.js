window.onload = function() {
  var colorPicker = new iro.ColorPicker("#picker");
  var receiving = false;
  
  colorPicker.on('color:change', function(color) {
    if (receiving)
      return;
    
    document.set_color(
      Math.floor(color.hue / 360 * 255).toString(),
      Math.min(Math.floor(color.saturation * 2.56), 255).toString(),
      Math.min(Math.floor(color.value * 2.56), 255).toString()
    );
  });
  
  window.addEventListener('message', event => {
    const message = event.data;

    if (message.type === 'get') {
      var hsv = colorPicker.color.hsv;
      var changed = false;
      
      try {
        hsv.h = Math.floor(parseInt(message.h) / 256 * 360);
        changed = true;
      } catch (e) {}
      try {
        hsv.s = Math.floor(parseInt(message.s) / 2.55);
        changed = true;
      } catch (e) {}
      try {
        hsv.v = Math.floor(parseInt(message.v) / 2.55);
        changed = true;
      } catch (e) {}
      
      if (changed) {
        receiving = true;
        colorPicker.color.hsv = hsv;
        receiving = false;
      }
    }
  });
}

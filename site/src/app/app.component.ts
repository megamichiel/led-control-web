import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '../environments/environment';

function loadProperty(key: string, def: any): any {
  var val = localStorage.hasOwnProperty(key) ? JSON.parse(<string>localStorage.getItem(key)) : def;

  val.save = function save() {
    delete val.save;
    localStorage.setItem(key, JSON.stringify(val));
    val.save = save;
  }

  return val;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'led-control';

  locations = loadProperty('locations', []);
  presets = loadProperty('presets', []);
  config = loadProperty('config', {});

  current_loc: any;

  brightness = 10;

  constructor(public dialog: MatDialog, private snackBar: MatSnackBar, @Inject(DOCUMENT) document: any) {
    if (this.config.location)
      this.select_location(this.config.location);

    document.set_color = function(h: string, s: string, v: string) {
      window.postMessage({
        type: 'set',
        h: h,
        s: s,
        v: v
      }, "*");
    };

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'get':
          this.brightness = message.brightness;
          break;

        case 'scan-result':
          for (var i in this.locations)
            if (this.locations[i].ip == message.ip)
              return;

          this.current_loc.ip = message.ip;
          break;
      }
    });

    if (environment.led_server) {
      var socket: WebSocket;

      let snackBar = this.snackBar;

      var snackBarRef: any = false;

      (function init() {
        socket = new WebSocket("ws://" + environment.led_server);

        socket.onopen = function(event: any) {
          if (snackBarRef) {
            snackBarRef.dismiss();
            snackBarRef = false;
          }
        }

        socket.onmessage = function(event: any) {
          window.postMessage(JSON.parse(event.data), '*');
        };

        socket.onclose = function(event: any) {
          if (!event.wasClean) {
            if (!snackBarRef) {
              snackBarRef = snackBar.open("Server connection lost");
            }
            setTimeout(init, 5000);
          }
        };

        socket.onerror = function(event: any) {
          console.log(`Server connection error: ${event.message}`);
        }
      })();

      window.addEventListener('message', function blah(event) {
        const message = event.data;

        // console.log("Message", message, socket);

        switch (message.type) {
          case 'set-ip': case 'set': case 'scan':
            socket.send(JSON.stringify(message));
            break;
        }
      });
    }
  }

  set_brightness(value: any, delay: number = 0) {
    this.brightness = value;

    /*if (delay > 0) {
      var now = Date.now();
      if (now < this._last_brightness + delay)
        return;

      this._last_brightness = now;
    }*/

    window.postMessage({
      type: 'set',
      bright: this.brightness.toString()
    }, "*");
  }

  get_location(): string {
    for (var i in this.locations)
      if (this.locations[i].selected)
        return this.locations[i].name;
    return "";
  }

  select_location(name: string) {
    for (var i in this.locations) {
      var loc = this.locations[i];
      if (loc.selected = name == loc.name) {
        window.postMessage({
          type: 'set-ip',
          ip: loc.ip
        }, "*");

        this.config.location = name;
        this.config.save();
      }
    }
  }

  edit_location(loc: any = null) {
    if (loc == null) {
      loc = { index: -1, name: '', ip: '' };
    } else {
      for (var i in this.locations) {
        if (this.locations[i].name == loc.name) {
          loc.index = i;
          break;
        }
      }
    }

    const d = this.dialog.open(LocationDialog, {
      data: loc
    });
    this.current_loc = loc;

    d.afterClosed().subscribe(result => {
      if (result) {
        if (result.delete) {
          this.locations.splice(result.delete, 1);

          this.locations.save();
        } else if (result.name.length > 0) {
          if (result.index == -1) {
            this.locations.push({
              name: result.name,
              ip: result.ip,
              selected: false
            });
          } else {
            var loc = this.locations[result.index];
            loc.name = result.name;
            loc.ip = result.ip;
          }

          this.locations.save();
        }
      }
    });
  }

  send(preset: any) {
    for (var i in this.locations)
      if (this.locations[i].selected)
        window.postMessage(Object.assign({ type: 'set' }, preset), "*");
  }

  add_preset(name: string, fade: number, h: string, s: string, v: string) {
    this.presets.push({ name: name, fade: fade, h: s, s: s, v: v });
    this.presets.save();
  }

  edit_preset(preset: any = null) {
    if (preset == null) {
      preset = { index: -1, name: '', fade: '', h: '', s: '', v: '' };
    } else {
      for (var i in this.presets) {
        if (this.presets[i].name == preset.name) {
          preset.index = i;
          break;
        }
      }
    }

    const d = this.dialog.open(PresetDialog, {
      data: preset
    });

    d.afterClosed().subscribe(result => {
      if (result) {
        if ("delete" in result) {
          this.presets.splice(result.delete, 1);

          this.presets.save();
        } else if (result.name.length > 0) {
          var copy = Object.assign({ selected: false }, result);
          delete copy.index;
          if (result.index == -1) {
            this.presets.push(copy);
          } else {
            this.presets[result.index] = copy;
          }

          this.presets.save();
        }
      }
    });
  }
}

export interface LocationDialogData {
  index: number;
  name: string;
  ip: string;
}

export interface PresetDialogData {
  index: number;
  name: string;
  fade: string;
  h: string;
  s: string;
  v: string;
}

@Component({
  selector: 'location-dialog',
  templateUrl: './location-dialog.html',
})
export class LocationDialog {

  constructor(public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LocationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LocationDialogData) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  scan(ip: string) {
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.exec(ip)) {
      this._snackBar.open("Please enter IP in form X.Y.Z (e.g. 192.168.1)", '', {
        duration: 2000
      });
      return;
    }
    for (var i = 0; i < 256; ++i) {
      window.postMessage({
        type: 'scan',
        ip: ip + '.' + i
      }, '*');
    }
  }
}

@Component({
  selector: 'preset-dialog',
  templateUrl: './preset-dialog.html',
})
export class PresetDialog {

  constructor(
    public dialogRef: MatDialogRef<PresetDialog>,
    @Inject(MAT_DIALOG_DATA) public data: PresetDialogData) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}

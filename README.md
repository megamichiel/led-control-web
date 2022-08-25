# led-control

This is a web (Angular) app designed to operate controllers running my [esp-leds](https://github.com/megamichiel/esp-leds) software. It can both run as a web app to use in a browser, or function as a standalone Electron app.



## Features

There's not much to say here. It's got a color picker, you can add locations (name/ip pairs), and presets that support the formulas as described in the esp-leds repository.



## Usage

You can either use the app as a website, or as Electron app:



### As a website

Since browser JS cannot communicate using UDP sockets directly, I made a web server that serves a static website, but also handles WebSockets which is used to forward packets to UDP.

Open the `server` folder with a terminal, and install npm dependencies using `npm install`. Then, you can simply use `node server.js` to start the server. This starts a web server on port 8080. If you wish to change that, either add the port as an argument (i.e. `node server.js 1234`), or open `server.js` and at the very top there's a `PORT` constant, change that as you desire by either replacing `8080` (the default) with your port or the entire variable which removes the option of parsing it as an argument.

If you wish to change any code related to the UI, that needs to be done in the `site` folder, where the sources are. Details about that can be found further down below.



### As an Electron app

The Electron app can be found in the `site` folder (along with the UI code). Open that folder in your terminal, and run `npm install` to install necessary dependencies. You can then use `npm run electron` to immediately start the Electron app, or build the app using the `electron-packager` module to create a standalone program (sort-of, it still is an entire folder of stuff, in which there's a file called `LedControl` that you can open). There's a built-in package script for Linux x64 in `package.json`: If you run `npm run package` it will be packaged. If you wish to build for something else, you can run `npx electron-packager ./ LedControl --platform=<platform> --arch=<arch>`.

Keep in mind: If you change user interface code for Electron, you need to rebuild those sources, Electron does not do this for you! Read below to see what to do for that.



## Modifying code

If you wish to change any of the user interface, you will find most stuff in the `site/src/electron`, `site/src/app` and `server` folders. `electron` and `server` contain backend code, and `app` contains user-facing (Angular) code.

### Backend

The file `ledconnection.js`, which can be found both in `site/src/electron` and `server`, contains code for communicating with devices. This file is identical in those two places, but I preferred this over keeping one copy and using deeper references. The files `site/src/electron/main.js` and `server/server.js` both initialize the functions `scanned` and `get`, and make sure to call `scan`, `set_ip` and `set` when needed. The Electron and web apps both use their own way of communicating with the backend, hence they both need their own implementation.



### Frontend

Frontend code can be found in the `site/src/app` folder. You can change stuff as you desire in there. The code here belongs to the project in the `site` folder. If you wish to compile the sources, open a terminal in that folder, and you can use several `ng` scripts to build/run it. Those will be explained in a minute, but first you need to know the build configurations that exist.

There are a few build configurations depending on your goal (defined in `angular.json`):

- By default, it's for Electron in development
- The `production` configuration is for Electron in production
- The `ws` configuration is for the WebSocket version (for running a web app)
- The `production_ws` is for the WebSocket version in production.

You can append `-c <configuration>` to a build/watch/serve command to specify the configuration to use.



The following commands are useful to know (remember to append `-c <cfg>` to these when needed). If your terminal cannot find the `ng` command, use `npx ng` instead. If it cannot find that, fix your terminal.

- Using `ng build` you can build the sources once, which are placed in the `site/dist/site` folder.
- Using `ng build --watch` you can build, but the program keeps running and recompiling when changes are made to the code. This is useful for live testing the Electron version.
- The command `ng serve` starts a web server on a given port, which can be useful for testing the web socket version. You can still run `server.js` as described before, but make sure to open the website on the `ng` port rather than the one used by `server.js`.
  - If your web socket server runs on a different port than 8080: In the files `site/src/environments/environment_ws.ts` and `-/environment_ws.prod.ts` you can change `led_server_port` to specify the target port.



#### Notes

##### Electron

As mentioned before, if you wish to change UI code for the Electron app, you need to run one of these build commands to update the user interface code, since Electron does not do that. You can open a separate terminal that runs Electron, as well as the one that builds the code. Ideally, you should have one terminal running `ng build --watch`, and the other running `npm run electron`.



##### Web app

If you're happy with your updated UI for the web app, you can build for production using `ng build -c production_ws`, which will put the compiled code in the `site/dist/site` folder. You need to copy these to the `server/static` folder to update the code for that server if you wish to run that one! Make sure to first delete all the files in `server/static`, and then you can copy all the files from `site/dist/site`.
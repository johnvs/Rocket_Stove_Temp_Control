# Rocket Stove Temperature Controller GUI
This is an [Electron](http://electron.atom.io)-based app that serves as a GUI for an embedded microcontroller-based rocket stove temperature controller. It communicates with the temp controller via USB.

### A little about Electron
From the [Electron website](https://electron.atom.io/docs/tutorial/about/): <br/>
"Electron is an open source library developed by GitHub for building cross-platform desktop applications with HTML, CSS, and JavaScript. Electron accomplishes this by combining Chromium and Node.js into a single runtime. Apps can be packaged for Mac, Windows, and Linux."

One thing to note about Electron development is that you will have two versions of Node on your development machine; your system installation and the version that gets installed and packaged with Electron. These do not need to be the same version number.

## Usage
To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/johnvs/Rocket_Stove_Temp_Control.git
# Go into the repository
cd Rocket_Stove_Temp_Control
# Install dependencies
npm install
# Rebuild the app dependencies for Electron's version of Node
npm rebuild
# Run the app
npm start
```
<br/>

### Native Packages
This project uses a native package ([serialport](https://www.npmjs.com/package/serialport)), which adds an additional step to the package install process. When you execute
```
npm install
```
as shown above, the packages in the ```dependencies``` and ```devDependencies``` section of the ```package.json``` file are downloaded and installed. If there are any native packages, they will then get compiled for your development version of node (and your dev system's processor).

And that won't do you any good if your system's version of node and Electron's version of node are different (which it probably will be).<br/>

To recomplie the packages (in the ```dependencies``` section) for Electron's version of node, this npm script is executed:
```
npm rebuild
```
<br>

Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/).

### Hardware
This project is designed to communicate with a Rocket Stove Temperature Controller (hardware) via USB. See the accompanying project - [Rocket Stove Temp Controller ](https://github.com/johnvs/Rocket_Stove_Temp_Control_Micro.git) (microcontroller code).

It can also be used as an example of how to implement this type of system, one consisting of an embedded microcontroller (with a USB port) and a computer based GUI.

## License

[MIT](https://github.com/johnvs/Rocket_Stove_Temp_Control/blob/master/LICENSE)

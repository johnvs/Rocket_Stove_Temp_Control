"use strict";

const fs = require('fs');
const url = require("url");
const SerialPort = require('serialport');

let serialPort;
let dataRecord = {};
let isStoveConnected = false;
let callbacks = {};
// Looks like:
// callbacks = {
//                "update" : updateCallback,
//                "controllerConnected" : ccCallback
//             }

exports.on =  function(eventName, callback) {
                console.log("stove-controller:on " + eventName);
                callbacks[eventName] = callback;
              };

exports.emit =  function(eventName, data) {
                  console.log("stove-controller:emit " + eventName);

                  if (typeof emitters[eventName] === "function") {
                    emitters[eventName](data);
                  } else {
                    console.log("event " + eventName + " is not a function");
                  }
                };

exports.init = initSerialPort;

const emitters = {

  "homeMotorBtnClicked" : function() {
        if (serialPort) {
          console.log('Home Motor button was clicked.');
      		serialPort.write('h\r');
        // } else {
        //   const warningMsg = 'Tried to home damper motor while not connected to stove controller';
        //   console.log(warningMsg);
        //   // Signal the client that it is not connected to a stove controller
        //   socketServer.emit('warning', warningMsg);
        }
    	},

  "potTempDesiredChanged" : function(data) {
        if (serialPort) {
          console.log('Desired pot temp new value = ' + data);
      		serialPort.write('m ' + data + '\r');
        // } else {
        //   console.log('Tried to change desired pot temp while not connected to stove controller');
        }
    	},

  "damperAngleChanged" : function(data) {
        if (serialPort) {
          console.log('Damper angle new value = ' + data);
      		serialPort.write('n ' + data + '\r');
        // } else {
        //   console.log('Tried to change damper angle while not connected to stove controller');
        }
    	},

  "blowerSpeedChanged" : function(data) {
        if (serialPort) {
          console.log('Blower speed new value = ' + data);
      		serialPort.write('f ' + data + '\r');
        // } else {
        //   console.log('Tried to change blower speed while not connected to stove controller');
        }
    	},

  "dataUpdateRateChanged" : function(data) {
        if (serialPort) {
          console.log('Data update rate new value = ' + data);
      		serialPort.write('q ' + data + '\r');
        // } else {
        //   console.log('Tried to change data update rate while not connected to stove controller');
        }
    	}
};

const serialPortConfig = {
  // defaults for Arduino serial communication
  baudrate    : 9600,
  dataBits    : 8,
  parity      : 'none',
  stopBits    : 1,
  flowControl : false
};

function initSerialPort() {
  console.log('Initializing serial ports.');

  SerialPort.list(checkPortAvailability);
}

// Callback for SerialPort.list
function checkPortAvailability(err, ports) {
  // portName = something like '/dev/tty.usbmodem2360871'
  const portNamePrefix = '/dev/cu.usbmodem';
  if (err) {
    console.log('Error listing port: ', err.message);
  } else {
    console.log('Available serial ports:');
    ports.forEach(function(port) {
      console.log('  Com name: ' + port.comName);
      console.log('    Device manufacturer: ' + port.manufacturer);
      if ((port.comName).startsWith(portNamePrefix)) {
        // We found a potential serial port
        console.log('Got a port address: ' + port.comName);
        serialPort = new SerialPort(port.comName, serialPortConfig, portOpenCallback);
        defineSerialPortEventHandlers();
      }
    });
    if (!serialPort) {
      console.log("Failed to find an open a serial port.");

      // Let client know that it is NOT connected to a stove controller.
      callbacks.controllerConnected(false);
    }
  }
}

// Callback for 'new SerialPort()'
function portOpenCallback(err) {
  if (err) {
    console.log('Serial Port Open Error: ', err.message);
  } else {
    // TODO - verify that the Teensy is communicating
    // serialPort.write('h', function(err) {
    //   if (err) {
    //     console.log('Error on serial port write: ', err.message);
    //   } else {
    //     console.log('Serial port open, initial message written');
    //   }
    // });

    // After confirming that the connected serial device is a stove controller,
    // let client know that it is connected.
    callbacks.controllerConnected(true);
    isStoveConnected = true;
  }
}

function defineSerialPortEventHandlers() {

  serialPort.on("open", function () {
    console.log('Serial Port is Open');

    // Processes incoming serial data
    serialPort.on('data', function(data) {

      let dataObj;
      try {
        // console.log("serial data = " + data);
        // console.log("typeof data = " + typeof data);

        dataObj = JSON.parse(data);
        console.log("New serial data:");
        console.log(dataObj);

        // Write data to file


        // Send the client that new serial data
        callbacks.update(dataObj);
        // for (let cb in callbacks) {
        //   console.log("callback " + cb + " is " + callbacks[cb]);
        // }
      }
      catch (err) {
        // console.log('Serial port error = ' + err);
        console.log('Non-JSON serial data received: \n' + data);
      }
    });
  });
}
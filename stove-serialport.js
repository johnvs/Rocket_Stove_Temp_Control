"use strict";

const SerialPort = require('serialport');

let serialPort;

let isConnected = false;

let onChangeHandlers;

module.exports = {

  addOnChangeHandlers : function(handlers) {
    // Handlers for events:
    //   controllerConnected
    //    dataRcvd
    onChangeHandlers = handlers;
  },

  sendStr: function(theString) {
             if (serialPort) {
               console.log('stove-serialport:sendStr: ' + theString);
               serialPort.write(theString);
             }
           },

  init : initSerialPort,
  isConnected : isConnected
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
  console.log('Initializing serial port.');
  SerialPort.list(checkPortAvailability);
}

// Callback for SerialPort.list
function checkPortAvailability(err, ports) {
  // portName = something like '/dev/tty.usbmodem2360871'
  const portNamePrefix = (process.platform === 'darwin') ? '/dev/cu.usbmodem' : 'COM';
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

      // Let interface controller know that it is NOT connected to a stove controller (Teensy).
      onChangeHandlers.controllerConnected(false);

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
    onChangeHandlers.controllerConnected(true);
    isConnected = true;
  }
}

function defineSerialPortEventHandlers() {

  serialPort.on("open", function () {
    console.log('Serial Port is Open');

    // Processes incoming serial data received as string
    serialPort.on('data', function(data) {

        // console.log("serial data = " + data);
        // console.log("typeof data = " + typeof data);
        let dataObj;
        try {
          dataObj = JSON.parse(data);
          console.log('New serial data:');
          console.log(dataObj);

          try {
            // Send the interface controller the new serial data
            onChangeHandlers.dataRcvd(dataObj);
          }
          catch (err) {
            console.log('Error processing received data: ' + err);
          }
        }
        catch (err) {
          console.log('Error parsing received data: ' + err);
          console.log('Non-JSON serial data received: \n' + data);
        }

    });
  });
}

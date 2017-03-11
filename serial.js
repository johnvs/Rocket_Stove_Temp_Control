"use strict";

const fs = require('fs');
const url = require("url");
const SerialPort = require('serialport');

let serialPort;

let dataRecord = {};
let isStoveConnected = false;

function initSocketIO(debug) {

	socketServer.on('connection', function (socket) {

  	socket.on('homeMotorBtnClicked', function() {
      if (serialPort) {
        console.log('Home Motor button was clicked.');
    		serialPort.write('h\r');
      // } else {
      //   const warningMsg = 'Tried to home damper motor while not connected to stove controller';
      //   console.log(warningMsg);
      //   // Signal the client that it is not connected to a stove controller
      //   socketServer.emit('warning', warningMsg);
      }
  	});

  	socket.on('potTempDesiredChanged', function(data) {
      if (serialPort) {
        console.log('Desired pot temp new value = ' + data);
    		serialPort.write('m ' + data + '\r');
      // } else {
      //   console.log('Tried to change desired pot temp while not connected to stove controller');
      }
  	});

  	socket.on('damperAngleChanged', function(data) {
      if (serialPort) {
        console.log('Damper angle new value = ' + data);
    		serialPort.write('n ' + data + '\r');
      // } else {
      //   console.log('Tried to change damper angle while not connected to stove controller');
      }
  	});

  	socket.on('blowerSpeedChanged', function(data) {
      if (serialPort) {
        console.log('Blower speed new value = ' + data);
    		serialPort.write('f ' + data + '\r');
      // } else {
      //   console.log('Tried to change blower speed while not connected to stove controller');
      }
  	});

  	socket.on('dataUpdateRateChanged', function(data) {
      if (serialPort) {
        console.log('Data update rate new value = ' + data);
    		serialPort.write('q ' + data + '\r');
      // } else {
      //   console.log('Tried to change data update rate while not connected to stove controller');
      }
  	});

  });
}

const serialPortConfig = {
  // defaults for Arduino serial communication
  baudrate    : 9600,
  dataBits    : 8,
  parity      : 'none',
  stopBits    : 1,
  flowControl : false
};

function initSerialPort() {
  // let portName = '/dev/cu.usbmodem2360871'; //change this to your Arduino port
  SerialPort.list(checkPortAvailability);
}

// Callback for SerialPort.list
function checkPortAvailability(err, ports) {
  // portName = something like '/dev/tty.usbmodem2360871'
  let portNamePrefix = '/dev/cu.usbmodem';
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
      // if (isClientConnected) {
      //   console.log("cPA: got me some socketServer goodness." + socketServer);
        // socketServer.emit('controllerConnected', false);
//        sendToClient('controllerConnected', false);
      // } else {
      //   console.log("cPA: The client is not connected.");
      // }
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
        dataObj = JSON.parse(data);
        console.log("New serial data:");
        console.log(dataObj);

        // Write data to file


        // Signal the client that new serial data is ready
        // socketServer.emit('update', dataObj);
        sendToClient('update', dataObj);
      }
      catch (err) {
        console.log('Non-JSON serial data received: \n' + data);
      }
    });
  });
}

exports.start = startServer;

"use strict";

const SerialPort = require('stoveSerialport');

let serialPort;
let dataRecord = {};
let isStoveConnected = false;

let callbacks = {};
// Looks like:
// callbacks = {
//                "update" : updateCallback,
//                "controllerConnected" : ccCallback
//             }

const controlModes = {
    damper : {
      'manual' : 0,
      'auto'   : 1
    },

    blower : {
      'manualPot' : 0,
      'manualUI'  : 1,
      'auto'      : 2
    }
};

module.exports = {
    on : function(eventName, callback) {
            console.log("stove-controller:on " + eventName);
            callbacks[eventName] = callback;
          },

    emit : function(eventName, data) {
              console.log("stove-controller:emit " + eventName);

              if (typeof emitters[eventName] === "function") {
                emitters[eventName](data);
              } else {
                console.log("event " + eventName + " is not a function");
              }
           },

    controllModes : controlModes,

    init : initSerialPort
};

  a : function(data) {
        // a  Pot thermocouple faults
        if ((typeof data === "number") && (data >= 0) && (data < 4)) {
          // $('#potTCFaults').text(tcFaults[data]);
          callbacks.update('potTCFaults', tcFaults[data]);
        }
      },

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

  "damperCntlModeChanged" : function(data) {
        if (serialPort) {
          if (controlModes.damper.hasOwnProperty(data)) {
            console.log('Damper Control Mode new value ' + data + ' = ' + controlModes.damper[data]);
        		serialPort.write('a ' + controlModes.damper[data] + '\r');
          } else {
            console.log('Bad damper control mode value ' + data);
          }
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

  "blowerCntlModeChanged" : function(data) {
        if (serialPort) {
          if (controlModes.blower.hasOwnProperty(data)) {
            console.log('Blower Control Mode new value ' + data + ' = ' + controlModes.blower[data]);
        		serialPort.write('b ' + controlModes.blower[data] + '\r');
          } else {
            console.log('Bad blower control mode value ' + data);
          }
        // } else {
        //   console.log('Tried to change desired pot temp while not connected to stove controller');
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

function initSerialPort() {
  console.log('Initializing serial ports.');

  SerialPort.list(checkPortAvailability);
}

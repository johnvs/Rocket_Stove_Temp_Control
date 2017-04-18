"use strict";

const serialPort = require('./stove-serialport');
const fileSys = require('./file-sys');

let uiOnChangeHandlers;
let ui;

let isFirstDataRcvd = true;

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

  addUIOnChangeHandlers : function(handlers) {
        // console.log("stove-controller:addUIOnChangeHandlers ");
        uiOnChangeHandlers = handlers;
      },

  addGettersAndSetters : function(gettersAndSetters) {
        ui = gettersAndSetters;
      },

  on : function(eventName, data) {
        console.log("stove-controller:on " + eventName);

        if (typeof events[eventName] === "function") {
          events[eventName](data);
        } else {
          console.log("event " + eventName + " is not a function");
        }
      },

  init : initController,
  cntlModes : controlModes
};

let dataRecord = {};

function initController() {
  console.log('Initializing stove controller.');
  serialPort.addOnChangeHandlers(onChangeHandlers);
  serialPort.init();
}

const onChangeHandlers = {
  controllerConnected : function (isConnected) {
      let result = "NOT ";
      if (isConnected) {
        // We are connected to the Teensy
        result = "";
      } else {
        // We are NOT connected to the Teensy
      }
      // const result = isStoveConnected ? "" : "NOT ";
      console.log("Stove controller is " + result + "connected.");

      uiOnChangeHandlers.controllerStatus(`The stove controller is ${result} connected.`);
    },

  dataRcvd : function (receivedData) {
    // Process data received from rocket stove controller

      // Vanilla JS version
      // const checkbox = document.querySelector('#saveDataChkbox');
      // if (checkbox.checked) {}
      // if ($('#saveDataChkbox').is(":checked")) {
      if ( ui.getSaveDataChkbx() ) {
        // Write data to file
        const dataRecord = generateDataRecord(receivedData);
        fileSys.writeData(dataRecord);  // typeof dataRecord = "string"
      }

      // Modify the UI with new data
      for (let item in receivedData) {
        // Update the corresponding UI element for each data item
        // console.log("  receivedData." + item + " = " + receivedData[item]);

        // Call the <item> event handler with the received data
        processRcvdData(item, receivedData[item]);
      }
      if (isFirstDataRcvd) {
        // We are done processing the first data packet, so clear the flag
        isFirstDataRcvd = false;
      }
    }
};

function generateDataRecord(data) {
  // Data to write to file:         Source   Key
  // 	Pot Temp, Actual              SC       b
  // 	Pot Temp, Desired             UI
  // 	Damper Angle                  SC       c
  // 	Damper control mode           UI
  //
  // 	Flue Temp                     SC       h
  // 	Blower speed, Desired (%)     UI
  // 	Blower speed, Actual (RPM)    SC       i
  // 	Blower control mode           UI
  //
  // Input:
  //   {"a":0, "b":63.95, "c":-1, "d":0, "e":0, "f":255, "g":0, "h":63.95, "i":-1, "j":0, "k":-1}
  //
  // Output:
  //   "Pot Temp Actual","Pot Temp Desired","Damper Angle","Damper control mode","Flue Temp","Blower Speed Desired","Blower speed Actual","Blower control mode"
  //   "63.95,90.0,45.5,1,1200.0,75.0,875.0,0"

  const currentTime = new Date();

  const theGoodStuff = currentTime.toString() + "," +
                       data.b.toString() + "," +
                       ui.getPotTempDesired().toString() + "," +
                       data.c.toString() + "," +
                       ui.getDamperCntlMode().toString() + "," +
                       data.h.toString() + "," +
                       ui.getBlowerSpeedManual().toString() + "," +
                       data.i.toString() + "," +
                       ui.getBlowerCntlMode().toString() + "\n";

  return theGoodStuff;
}

const msgTerminator = '\r';

const events = {

  'saveDataChkboxChecked' : function() {
      // Add a column header to the data file everytime the checkbox is checked
      fileSys.initDataFile();
    },

  "homeMotorBtnClicked" : function() {
        if (serialPort) {
          console.log('Home Motor button was clicked.');
      		// serialPort.write('h\r');
      		serialPort.sendStr('h' + msgTerminator);
        // } else {
        //   const warningMsg = 'Tried to home damper motor while not connected to stove controller';
        //   console.log(warningMsg);
        //   // Signal the client that it is not connected to a stove controller
        //   socketServer.emit('warning', warningMsg);
        }
    	},

  "potTempDesiredChanged" : function(temp) {
        if (!isFirstDataRcvd) {
          if (serialPort) {
            console.log('Desired pot temp new value = ' + temp);
        		serialPort.sendStr('m ' + temp + msgTerminator);
          // } else {
          //   console.log('Tried to change desired pot temp while not connected to stove controller');
          }
        }
    	},

  "damperCntlModeChanged" : function(cntlMode) {
        if (serialPort) {
          if (controlModes.damper.hasOwnProperty(cntlMode)) {
            console.log('Damper Control Mode new value ' + cntlMode + ' = ' + controlModes.damper[cntlMode]);
        		// serialPort.sendStr('a ' + controlModes.damper[cntlMode] + msgTerminator);
        		serialPort.sendStr('a ' + controlModes.damper[cntlMode] + msgTerminator);
          } else {
            console.log('Bad damper control mode value ' + cntlMode);
          }
        // } else {
        //   console.log('Tried to change desired pot temp while not connected to stove controller');
        }
    	},

  "damperAngleChanged" : function(data) {
        if (serialPort) {
          console.log('Damper angle new value = ' + data);
      		serialPort.sendStr('n ' + data + msgTerminator);
        // } else {
        //   console.log('Tried to change damper angle while not connected to stove controller');
        }
    	},

  "blowerCntlModeChanged" : function(cntlMode) {
        if (serialPort) {
          if (controlModes.blower.hasOwnProperty(cntlMode)) {
            console.log('Blower Control Mode new value ' + cntlMode + ' = ' + controlModes.blower[cntlMode]);
        		serialPort.sendStr('b ' + controlModes.blower[cntlMode] + msgTerminator);
          } else {
            console.log('Bad blower control mode value ' + cntlMode);
          }
        // } else {
        //   console.log('Tried to change desired pot temp while not connected to stove controller');
        }
    	},

  "blowerSpeedChanged" : function(data) {
        // The first time through after the stove controller connects we set the slider
        // value from the controller data, so don't just echo that back to the controller
        if (!isFirstDataRcvd) {
          if (serialPort) {
            console.log('Blower speed new value = ' + data);
        		serialPort.sendStr('f ' + data + msgTerminator);
          // } else {
          //   console.log('Tried to change blower speed while not connected to stove controller');
          }
        }
    	},

  "dataUpdateRateChanged" : function(data) {
        if (serialPort) {
          console.log('Data update rate new value = ' + data);
      		serialPort.sendStr('q ' + data + msgTerminator);
        // } else {
        //   console.log('Tried to change data update rate while not connected to stove controller');
        }
    	}
};

let prevDamperAngle;

function getKeyFromValue(obj, val) {
  let result;
  for (var key in obj) {
    if (obj[key] === val) {
      result = key;
      break;
    }
  }
  return result;
}

function processRcvdData(name, value) {

  const tcFaults = {
    0 : "No faults",
    1 : "No connection",
    2 : "Short to ground",
    3 : "Short to VCC",
    MIN : 0,
    MAX : 3
  };

  const damperAngle = {
    MIN : 0,
    MAX : 90,
    INVALID : -1
  };

  const motorPosition = {
    MIN : 0,
    MAX : 199,
    INVALID : -1
  };

  const blowerSpeedRPM = {
    MIN : 0,
    MAX : 2000,
    INVALID : -1
  };

  const blowerSpeedPercent = {
    MIN : 0,
    MAX : 100,
    INVALID : -1
  };

  /*
    Data packet message format
    a  Pot Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
    b  Pot Temp, Actual (˚F)
    c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
    d  Damper Control Mode (0 = Manual Pot, 1 = Manual UI, 2 = Auto)
    e  Damper motor is Homed (0 = No, 1 = Yes)
    f  Damper motor position (-1 = motor not homed, 0 - 199)
    g  Flue Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
    h  Flue Temp (˚F)
    i  Blower speed, Actual (RPM)
    j  Blower Control Mode (0 = ManualPot, 1 = ManualUI, 2 = Auto)
    k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)
    l  Blower UI speed, Set (%)

    example data packet:
     '{a:<data>, b:<data>, c:<data>, d:<data>, e:<data>, f:<data>, g:<data>, h:<data>, i:<data>, j:<data>, k:<data>, l:<data>}'
  */
  const dataEventHandlers = {
    a : function(fault) {
          // a  Pot thermocouple faults
          if ((typeof fault === "number") && (fault >= tcFaults.MIN) && (fault <= tcFaults.MAX)) {
            uiOnChangeHandlers.potTCFaults(tcFaults[fault]);
          }
        },
    b : function(temp) {
          // b  Pot Temp, Actual (˚F)
          if (typeof temp === "number") {
            uiOnChangeHandlers.potTempActual(temp);
          }
        },
    c : function(angle) {
          // c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
          if (typeof angle === "number") {
            if ((angle >= damperAngle.MIN) && (angle <= damperAngle.MAX)) {
              if ( (prevDamperAngle === undefined) || (prevDamperAngle !== angle) ) {
                prevDamperAngle = angle;
                uiOnChangeHandlers.damperAngleActual(angle);
                // Write new angle to UI recent changes pane
                uiOnChangeHandlers.recentChangesDamper(angle);
              }
            } else if (angle === damperAngle.INVALID) {
              uiOnChangeHandlers.damperAngleActual('--');
            }
          }
        },
    d : function(cntlModeInt) {
          // d  Damper Control Mode (0 = Manual, 1 = Auto)
          if (isFirstDataRcvd) {
            const cntlMode = getKeyFromValue(controlModes.damper, cntlModeInt);
            if (cntlMode) {
              // if cntlMode is other than undefined
              uiOnChangeHandlers.damperCntlMode(cntlMode);
            }
          }
        },
    e : function(isHomed) {
          // e  Motor is Homed (0 = No, 1 = Yes)
          if (isHomed === 0) {
            uiOnChangeHandlers.damperMotorIsHomed('No');
          } else if (isHomed === 1) {
            uiOnChangeHandlers.damperMotorIsHomed('Yes');
          } else {
            uiOnChangeHandlers.damperMotorIsHomed('--');
          }
        },
    f : function(pos) {
          // f  Motor position (-1 = motor not homed, 0 - 199)
          if (typeof pos === 'number') {
            if ((pos >= motorPosition.MIN) && (pos < motorPosition.MAX)) {
              uiOnChangeHandlers.damperMotorPos(pos);
            } else if (pos === motorPosition.INVALID) {
              uiOnChangeHandlers.damperMotorPos('Not Homed');
            }
          }
        },
    g : function(fault) {
          // g  Flue thermocouple faults
          if ((typeof fault === "number") && (fault >= tcFaults.MIN) && (fault <= tcFaults.MAX)) {
            uiOnChangeHandlers.flueTCFault(tcFaults[fault]);
          }
        },
    h : function(temp) {
          // h  Flue Temp (˚F)
          if (typeof temp === "number") {
            uiOnChangeHandlers.flueTempActual(temp);
          }
        },
    i : function(spd) {
          // i  Fan speed, Actual (-1 = unavailable, 0 - ??? = speed in RPM)
          if (typeof spd === "number") {
            if ((spd >= blowerSpeedRPM.MIN) && (spd <= blowerSpeedRPM.MAX)) {
              uiOnChangeHandlers.blowerSpeedActual(spd);
            } else if (spd === blowerSpeedRPM.INVALID) {
              uiOnChangeHandlers.blowerSpeedActual("--");
            }
          }
        },
    j : function(cntlModeInt) {
          // j  Blower Control Mode (0 = ManualPot, 1 = ManualUI, 2 = Auto)
          if (isFirstDataRcvd) {
            const cntlMode = getKeyFromValue(controlModes.blower, cntlModeInt);
            if (cntlMode) {
              // if cntlMode is other than undefined
              uiOnChangeHandlers.blowerCntlMode(cntlMode);
            }
          }
        },
    k : function(spd) {
          // k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)
          if (typeof spd === "number") {
            if ((spd >= blowerSpeedPercent.MIN) && (spd <= blowerSpeedPercent.MAX)) {
              uiOnChangeHandlers.blowerCommandSpeed(spd);
            } else if (spd === blowerSpeedPercent.INVALID) {
              uiOnChangeHandlers.blowerCommandSpeed('--');
            }
          }
        },
    l : function(spd) {
          // l  Blower UI speed, Set (%)
          if (typeof spd === "number") {
            if ((spd >= blowerSpeedPercent.MIN) && (spd <= blowerSpeedPercent.MAX)) {
              if (isFirstDataRcvd) {
                uiOnChangeHandlers.blowerSpeedSlider(spd);
              }
            } else if (spd === blowerSpeedPercent.INVALID) {
              // $( "#blowerSpeedManual" ).val("--");
            }
          }
        },
    m : function(temp) {
          // m  Pot Temp, Desired (˚F)
          if (isFirstDataRcvd) {
            if (typeof temp === "number") {
              uiOnChangeHandlers.potTempDesired(temp);
            }
          }
        }
  };

  const handlerKeysArray = Object.keys(dataEventHandlers);
  if (handlerKeysArray.includes(name)) {
    dataEventHandlers[name](value);
  }

}

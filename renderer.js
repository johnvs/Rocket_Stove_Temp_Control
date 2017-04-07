"use strict";

window.$ = window.jQuery = require('jquery');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/button');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/slider');
require('jquery-ui/ui/keycode');

const stoveController = require('./stove-controller');
const fileSys = require('./file-sys');

//let saveDataToFile = false;

function handleDataEvent(name, value) {

  const tcFaults = {
    0 : "No faults",
    1 : "No connection",
    2 : "Short to ground",
    3 : "Short to VCC"
  };

  /*
    Data packet message format
    a  Pot Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
    b  Pot Temp, Actual (˚F)
    c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
    d  Damper Control Mode (0 = Manual Pot, 1 = Manual UI, 2 = Auto)
    e  Motor is Homed (0 = No, 1 = Yes)
    f  Motor position (-1 = motor not homed, 0 - 199)
    g  Flue Temp Faults (0 = No faults, 1 = No connection, 2 = Short to ground, 3 = Short to VCC)
    h  Flue Temp (˚F)
    i  Fan speed, Actual (RPM)
    j  Blower Control Mode (0 = Manual, 1 = Auto)
    k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)

    example data packet:
     '{a:<data>, b:<data>, c:<data>, d:<data>, e:<data>, f:<data>, g:<data>, h:<data>, i:<data>, j:<data>, k:<data>}'
  */
  const dataEventHandlers = {
    a : function(data) {
          // a  Pot thermocouple faults
          if ((typeof data === "number") && (data >= 0) && (data < 4)) {
            $('#potTCFaults').text(tcFaults[data]);
          }
        },
    b : function(data) {
          // b  Pot Temp, Actual (˚F)
          if (typeof data === "number") {
            $('#potTempActual').text(data);
          }
        },
    c : function(data) {
          // c  Damper Angle (-1 = motor not homed, 0 - 90 degrees)
          if (typeof data === "number") {
            if ((data >= 0) && (data < 90)) {
              $('#damperAngleActual').text(data);
            } else if (data === -1) {
              $('#damperAngleActual').text("---");
            }
          }
        },
    d : function(data) {
          // d  Damper Control Mode (0 = Manual, 1 = Auto)
          if (data === 0) {
            // $( "#damperManualCntl" ).prop("checked", true);
          } else if (data === 1) {
            // $( "#damperAutoCntl" ).prop("checked", true);
          }
        },
    e : function(data) {
          // e  Motor is Homed (0 = No, 1 = Yes)
          if (data === 0) {
            $( "#damperMotorIsHomed" ).text("No");
          } else if (data === 1) {
            $( "#damperMotorIsHomed" ).text("Yes");
          } else {
            $( "#damperMotorIsHomed" ).text("---");
          }
        },
    f : function(data) {
          // f  Motor position (-1 = motor not homed, 0 - 199)
          if (typeof data === "number") {
            if ((data >= 0) && (data < 199)) {
              $('#damperMotorPos').text(data);

              // Convert 0 - 200 to 0 - 360
              // const positionDegrees = (data * 360) / 200;
              // $('#damperAngleActual').text(positionDegrees);

            } else if (data === -1) {
              $('#damperMotorPos').text("Not Homed");
            }
          }
        },
    g : function(data) {
          // g  Flue thermocouple faults
          if ((typeof data === "number") && (data >= 0) && (data < 4)) {
            $('#flueTCFault').text(tcFaults[data]);
          }
        },
    h : function(data) {
          // h  Flue Temp (˚F)
          if (typeof data === "number") {
            $('#flueTempActual').text(data);
          }
        },
    i : function(data) {
          // i  Fan speed, Actual (-1 = unavailable, 0 - ??? = speed in RPM)
          if (typeof data === "number") {
            if ((data >= 0) && (data <= 100)) {
              $('#blowerSpeedActual').text(data);
            } else if (data === -1) {
              $('#blowerSpeedActual').text("---");
            }
          }
        },
    j : function(data) {
          // j  Blower Control Mode (0 = Manual, 1 = Auto)
          if (data === 0) {
            // $( "#blowerManualCntl" ).prop( "checked", true);
          } else if (data === 1) {
            // $( "#blowerAutoCntl" ).prop( "checked", true);
          }
        },
    k : function(data) {
          // k  Blower Algorithm Command Speed (-1 = N/A, 0 - 100%)
          if (typeof data === "number") {
            if ((data >= 0) && (data <= 100)) {
              $('#blowerCommandSpeed').text(data);
            } else if (data === -1) {
              $('#blowerCommandSpeed').text("---");
            }
          }
        }
  };

  const handlerKeysArray = Object.keys(dataEventHandlers);
  if (handlerKeysArray.includes(name)) {
    dataEventHandlers[name](value);
  }

}

// Process data received from rocket stove controller
stoveController.on('update', function (receivedData) {

  // Vanilla JS version
  // const checkbox = document.querySelector('#saveDataChkbox');
  // if (checkbox.checked) {}
  if ($('#saveDataChkbox').is(":checked")) {
    // Write data to file
    const dataRecord = generateDataRecord(receivedData);
    fileSys.writeData(dataRecord);  // typeof dataRecord = "string"
  }

  // Modify the UI with new data
  for (let item in receivedData) {
    // Update the corresponding UI element for each data item
    // console.log("  receivedData." + item + " = " + receivedData[item]);

    // Call the <item> event handler with the received data
    handleDataEvent(item, receivedData[item]);
  }
});

// Process message from server
stoveController.on('controllerConnected', function (isStoveConnected) {

    let result = "NOT ";
    if (isStoveConnected) {
      // If the stove controller is connected, init it's desired pot temp
      const potTemp = Math.floor( $("#potTempDesired").val() );
      stoveController.emit("potTempDesiredChanged", potTemp);
      result = "";
    }
    // const result = isStoveConnected ? "" : "NOT ";
    console.log("Stove controller is " + result + "connected.");
    $('#controllerIsConnected p').text(`The stove controller is ${result} connected.`);
});

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
                       $( "#potTempDesired" ).val().toString() + "," +
                       data.c.toString() + "," +
                       $("input[name=damperCntlModeRadBtn]:checked").val().toString() + "," +
                       data.h.toString() + "," +
                       $( "#blowerSpeedManual" ).val().toString() + "," +
                       data.i.toString() + "," +
                       $("input[name=blowerCntlModeRadBtn]:checked").val().toString() + "\n";

  return theGoodStuff;
}

stoveController.init();

(function initUI() {

  console.log("initUI");

  // Init Home Motor button
  $( "#homeMotorBtn" ).button();
  $( '#homeMotorBtn' ).on( "click", function(event) {
    stoveController.emit('homeMotorBtnClicked');
  });

  // Initialize the values of the UI elements
  $( "#potTempDesired" ).val(0);
  $( "#damperAngleManual" ).val(0);
  $( "#blowerSpeedManual" ).val(0);
  $( "#dataUpdateRateInput" ).val(5);
  $( "#damperManualCntl" ).prop("checked", true);
  $( "#blowerManualPotCntl" ).prop("checked", true);

  // Init the desired pot temperature input and slider event handlers
  $( '#potTempDesired' ).on( "change", function(event, ui) {
      const value = Math.floor( $("#potTempDesired").val() );

      console.log("potTempDesired change event: value = " + value);
      $( "#potTempSlider" ).slider( "value", value);
  });

  $( "#potTempSlider" ).slider({
    min : 0,
    max : 212,
    value : 0,
    change: function(event, ui) {
        console.log("potTempSlider change event: value = " + ui.value);
        stoveController.emit("potTempDesiredChanged", ui.value);
        $( "#potTempDesired" ).val(ui.value);
    }
  });

  // Init the damper angle input and slider event handlers
  $( '#damperAngleManual' ).change(function(event, ui) {
      const value = Math.floor( $("#damperAngleManual").val() );
      console.log("damperAngleManual change event: value = " + value);
      $( "#damperAngleSlider" ).slider( "value", value);
  });

  // Damper Control Mode Radio Buttons
  $('input[name=damperCntlModeRadBtn]').click(function() {
      let newCntlMode = $('input[name=damperCntlModeRadBtn]:checked').val();
      if ( newCntlMode === "manual" ) {
        // enable the manual damper controls
        $( "#damperAngleSlider" ).slider( "enable" );
        document.getElementById('damperAngleManual').disabled = false;
        $( "#homeMotorBtn" ).button( "enable" );

        // send message to stove controller
        stoveController.emit("damperCntlModeChanged", newCntlMode);

      } else if ( newCntlMode === "auto" ) {
        // auto - disable the manual damper controls
        $( "#damperAngleSlider" ).slider( "disable" );
        document.getElementById('damperAngleManual').disabled = true;
        $( "#homeMotorBtn" ).button( "disable" );

        // send message to stove controller
        stoveController.emit("damperCntlModeChanged", newCntlMode);

      } else {
        console.log('Bad damperCntlMode value ' + newCntlMode);
      }
  });

  // Blower Control Mode Radio Buttons
  $('input[name=blowerCntlModeRadBtn]').click(function() {
      let newCntlMode = $('input[name=blowerCntlModeRadBtn]:checked').val();
      if ( newCntlMode === 'manualUI' ) {
        // enable the manual blower controls
        $( "#blowerSpeedSlider" ).slider( "enable" );
        document.getElementById('blowerSpeedManual').disabled = false;

        // send message to stove controller
        stoveController.emit("blowerCntlModeChanged", newCntlMode);

      } else if ( (newCntlMode === 'manualPot' ) ||
                  (newCntlMode === 'auto' ) ) {
        // auto or manual Potentiometer - disable the UI manual blower controls
        $( "#blowerSpeedSlider" ).slider( "disable" );
        document.getElementById('blowerSpeedManual').disabled = true;

        // send message to stove controller
        stoveController.emit("blowerCntlModeChanged", newCntlMode);

      } else {
        console.log('Bad blowerCntlMode value.');
      }
  });

  $( "#damperAngleSlider" ).slider({
    min : 0,
    max : 90,
    value : 0,
    change: function(event, ui) {
        console.log("damperAngleSlider change event: value = " + ui.value);
        stoveController.emit("damperAngleChanged", ui.value);
        $( "#damperAngleManual" ).val(ui.value);
      }
  });

  // Init the desired blower speed input and slider event handlers
  $( "#blowerSpeedManual" ).change(function(event) {
      const value = Math.floor( $("#blowerSpeedManual").val() );
      console.log("blowerSpeedManual change event: value = " + value);
      $( "#blowerSpeedSlider" ).slider( "value", value);
  });

  $( "#blowerSpeedSlider" ).slider({
    min : 0,
    max : 100,
    value : 0,
    change: function(event, ui) {
      console.log("blowerSpeedSlider change event: value = " + ui.value);
      stoveController.emit('blowerSpeedChanged', ui.value);
      $( "#blowerSpeedManual" ).val(ui.value);
    }
  });

  // Init the dataUpateRate input handler
  $( "#dataUpdateRateInput" ).change(function(event) {
      const value = Math.floor( $("#dataUpdateRateInput").val() );
      console.log("dataUpdateRateInput change event: value = " + value);
      stoveController.emit('dataUpdateRateChanged', value);
  });

  // Save Data checkbox event handler
  $( "#saveDataChkbox" ).change(function(event) {
      // saveDataToFile = this.checked;
      if ($('#saveDataChkbox').is(":checked")) {
        // Add a column header to the data file everytime the checkbox is checked
        fileSys.initDataFile();
      }
  });

})();

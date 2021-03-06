"use strict";

window.$ = window.jQuery = require('jquery');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/button');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/slider');
require('jquery-ui/ui/keycode');

const stoveController = require('./scripts/stove-controller');

let recentChangesDamper = [];
const RECENT_CHANGES_MSG_COUNT_MAX = 5;

function timeNow() {
  const d = new Date();
  const hr  = (d.getHours()   < 10 ? '0' : '') + d.getHours();
  const min = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  const sec = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
  return hr + ':' + min + ':' + sec;
}

function displayRecentChangeDamper(angle) {
  const currentTime = timeNow();

  // Create a new message of this form:
  //   Damper Position Changed to 90 degrees @ 12:35:23
  //   Blower Speed Changed to 85% @ 12:35:23
  const newMesssage = `Damper Position Changed to ${angle} degrees @ ${currentTime}`;

  if (recentChangesDamper.length < RECENT_CHANGES_MSG_COUNT_MAX) {
    // Add the new message to the bottom of the list in the div
    $(`#recentChangesDamper p:nth-child(${recentChangesDamper.length + 1})`).text(newMesssage);

    // Add the new message to the buffer
    recentChangesDamper.push(newMesssage);
  } else {
    // Add the new message to the bottom of the list and scroll the older ones up
    for (let i = 0; i < recentChangesDamper.length - 1; i++) {
      recentChangesDamper[i] = recentChangesDamper[i+1];
    }
    recentChangesDamper[4] = newMesssage;

    recentChangesDamper.forEach(function(elem, i) {
      $(`#recentChangesDamper p:nth-child( ${ i+1 } )`).text(elem);
    });
  }
}

// TODO - rename this
const gettersAndSetters = {
  getPotTempDesired : function() {
      return $("#potTempDesired").val();
    },

  getSaveDataChkbx : function() {
      return $('#saveDataChkbox').is(":checked");
    },

  getDamperCntlMode : function() {
      return $("input[name=damperCntlModeRadBtn]:checked").val();
    },

  getBlowerCntlMode : function() {
      return $("input[name=blowerCntlModeRadBtn]:checked").val();
    },

  getBlowerSpeedManual : function() {
      return $( "#blowerSpeedManual" ).val();
    }
};

const onChangeHandlers = {

  'recentChangesDamper' : displayRecentChangeDamper,

  'controllerStatus' : function(status) {
      $('#controllerIsConnected p').text(status);
    },

  'potTCFaults' : function(tcFault) {
      $('#potTCFaults').text(tcFault);
    },

  'potTempActual' : function(temp) {
      $('#potTempActual').text(temp);
    },

  'potTempDesired' : function(temp) {
      $( "#potTempSlider" ).slider( "value", temp);
      // $('#potTempDesired').val(temp);
    },

  'damperAngleActual' : function(angle) {
      $('#damperAngleActual').text(angle);
    },

  'damperManualCntl' : function(data) {
      $( "#damperManualCntl" ).prop("checked", true);
    },

  'damperAutoCntl' : function(data) {
      $( "#damperAutoCntl" ).prop("checked", true);
    },

  'damperCntlMode' : function(btn) {
      if (btn === 'manual') {
        $( "#damperManualCntl" ).prop("checked", true);
        damperManualControls.enable();
      } else if (btn === 'auto') {
        $( "#damperAutoCntl" ).prop("checked", true);
        damperManualControls.disable();
      }
    },

  'damperMotorIsHomed' : function(text) {
      $( "#damperMotorIsHomed" ).text(text);
    },

  'damperMotorPos' : function(pos) {
      $('#damperMotorPos').text(pos);
    },

  'flueTCFault' : function(fault) {
      $('#flueTCFault').text(fault);
    },

  'flueTempActual' : function(temp) {
      $('#flueTempActual').text(temp);
    },

  'blowerSpeedActual' : function(spd) {
      $('#blowerSpeedActual').text(spd);
    },

  'blowerCntlMode' : function(btn) {
      switch (btn) {
        case stoveController.cntlModes.blower.manualPot:
          $( "#blowerManualPotCntl" ).prop("checked", true);
          break;

        case stoveController.cntlModes.blower.manualUI:
          $( "#blowerManualUICntl" ).prop("checked", true);
          blowerManualControls.enable();
          break;

        case stoveController.cntlModes.blower.auto:
          $( "#blowerAutoCntl" ).prop("checked", true);
          break;

        default:
          break;
      }
    },

  'blowerCommandSpeed' : function(spd) {
      $('#blowerCommandSpeed').text(spd);
    },

  'blowerSpeedSlider' : function(data) {
      $( "#blowerSpeedSlider" ).slider( "value", data);
    }

};

stoveController.addUIOnChangeHandlers(onChangeHandlers);
stoveController.addGettersAndSetters(gettersAndSetters);
stoveController.init();
initUI();

const damperManualControls = {
  enable : function () {
      // manual mode - enable the manual damper controls
      $( "#damperAngleSlider" ).slider( "enable" );
      // document.getElementById('damperAngleManual').disabled = false;
      $( "#damperAngleManual" ).prop('disabled', false);
      $( "#homeMotorBtn" ).button( "enable" );
  },
  disable : function() {
      // auto mode - disable the manual damper controls
      $( "#damperAngleSlider" ).slider( "disable" );
      // document.getElementById('damperAngleManual').disabled = true;
      $( "#damperAngleManual" ).prop('disabled', true);
      $( "#homeMotorBtn" ).button( "disable" );
  }
};

const blowerManualControls = {
  enable : function () {
      // manualUI mode - enable the manual blower controls
      $( "#blowerSpeedSlider" ).slider( "enable" );
      // document.getElementById('blowerSpeedManual').disabled = false;
      $( "#blowerSpeedManual" ).prop('disabled', false);
  },
  disable : function () {
      // auto or manual Potentiometer - disable the UI manual blower controls
      $( "#blowerSpeedSlider" ).slider( "disable" );
      // document.getElementById('blowerSpeedManual').disabled = true;
      $( "#blowerSpeedManual" ).prop('disabled', true);
  }
};

const onChange = {
  damperCntlMode : [
      damperManualControls.enable,
      damperManualControls.disable
  ],
  blowerCntlMode : [
      blowerManualControls.disable,
      blowerManualControls.enable,
      blowerManualControls.disable
  ]
};

function initUI() {
  console.log("Initializing UI.");

  // Init Home Motor button
  $( "#homeMotorBtn" ).button();
  $( '#homeMotorBtn' ).on( "click", function(event) {
    stoveController.on('homeMotorBtnClicked');
  });

  // Initialize the values of the UI elements
  $( "#potTempDesired" ).val(0);
  $( "#damperAngleManual" ).val(0);
  $( "#blowerSpeedManual" ).val(0);
  $( "#dataUpdateRateInput" ).val(5);

  // TODO - fix this, i.e. stoveController.cntlModes.blower.manualPot
  $( "#blowerManualPotCntl" ).val('manualPot');
  $( "#blowerManualUICntl" ).val('manualUI');
  $( "#blowerAutoCntl" ).val('auto');

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
        stoveController.on("potTempDesiredChanged", ui.value);
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
      if ( stoveController.cntlModes.damper.hasOwnProperty(newCntlMode) ) {
        // send message to stove controller
        stoveController.on("damperCntlModeChanged", newCntlMode);

        // Enable or disable the damper manual controls based on the selected button
        onChange.damperCntlMode[stoveController.cntlModes.damper[newCntlMode]]();

      } else {
        console.log('Bad damperCntlMode value ' + newCntlMode);
      }
  });

  // Blower Control Mode Radio Buttons
  $('input[name=blowerCntlModeRadBtn]').click(function() {
      let newCntlMode = $('input[name=blowerCntlModeRadBtn]:checked').val();
      if ( stoveController.cntlModes.blower.hasOwnProperty(newCntlMode) ) {
        // send message to stove controller
        stoveController.on("blowerCntlModeChanged", newCntlMode);

        // Enable or disable the blower manual controls based on the selected button
        onChange.blowerCntlMode[stoveController.cntlModes.blower[newCntlMode]]();
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
        stoveController.on("damperAngleChanged", ui.value);
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
      stoveController.on('blowerSpeedChanged', ui.value);
      $( "#blowerSpeedManual" ).val(ui.value);
    }
  });

  // Init the blower manual controls as disabled
  $( "#blowerSpeedSlider" ).slider('disable');
  $( "#blowerSpeedManual" ).prop('disabled', true);
//  document.getElementById('blowerSpeedManual').disabled = true;

  // Init the dataUpateRate input handler
  $( "#dataUpdateRateInput" ).change(function(event) {
      const value = Math.floor( $("#dataUpdateRateInput").val() );
      console.log("dataUpdateRateInput change event: value = " + value);
      stoveController.on('dataUpdateRateChanged', value);
  });

  // Save Data checkbox event handler
  $( "#saveDataChkbox" ).change(function(event) {
      if ($('#saveDataChkbox').is(":checked")) {
        stoveController.on('saveDataChkboxChecked');
      }
  });

}

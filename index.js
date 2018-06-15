#!/usr/local/bin/node
var http = require('http');
var express = require('express');
var Gpio = require('onoff').Gpio;
var exec = require('child_process').exec;
var sleep = require('sleep');
var ds18b20 = require('ds18b20');
var LCD = require('lcdi2c');
var rpiDhtSensor = require('rpi-dht-sensor');
var PiCamera = require('pi-camera');

const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/public/test.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
});

var LEDPIN = [17,27,22];
var RELAYPIN=18;
var PIRPIN = 24;
var RESETPIN = 5;
var SERVERPORT=80;
var MILLI=100;
var IDTEMP;
var app = express();
var dht = new rpiDhtSensor.DHT11(23);

app.use(express.static(__dirname + '/public'));
ds18b20.sensors(function(err, ids) {
    IDTEMP = ids;
});

var LED = [];
for (i=0; i<LEDPIN.length; i++)
    LED[i] = new Gpio(LEDPIN[i], 'out');
// Test Led
LED.forEach( (led) => {
    led.writeSync(1);
    sleep.msleep(MILLI);
    led.writeSync(0);
});

var RELAY = new Gpio(RELAYPIN, 'out');
// Test Relay
RELAY.writeSync(1);
sleep.msleep(MILLI);
RELAY.writeSync(0);

// PIR Sensor
var PIR = new Gpio(PIRPIN, 'in');

// RESET
var RESET = new Gpio(RESETPIN, 'in', 'rising', {debounceTimeout: 10});
RESET.watch(function (err,value) {
    // Test Led
    LED.forEach( (led) => {
	led.writeSync(1);
        sleep.msleep(MILLI);
        led.writeSync(0);
    });
    // Test Relay
    RELAY.writeSync(1);
    sleep.msleep(MILLI);
    RELAY.writeSync(0);

    // Test LCD
    lcd.off();
    lcd.clear();
    lcd.println("Hello",1);
    lcd.println("World",2);
    lcd.on();
});

app.post('/temp1',function(req,res) {
    var output = { "output" : ds18b20.temperatureSync(IDTEMP) + " C" };
    res.send(output);
});

app.post('/temp2',function(req,res) {
    var output = { "output" : dht.read().temperature.toFixed(2) + " C" };
    res.send(output);
});

app.post('/hum',function(req,res) {
    var output = { "output" : dht.read().humidity.toFixed(2) + " %" };
    res.send(output);
});

app.post('/relay_on',function(req,res) {
    RELAY.writeSync(1);
    var output = { "output" : "RELAY ON" };
    res.send(output);
});

app.post('/relay_off',function(req,res) {
    RELAY.writeSync(0);
    var output = { "output" : "RELAY OFF" };
    res.send(output);
});

app.post('/pir',function(req,res) {
    var pirStatus = PIR.readSync() == 0?"OFF":"ON";
    var output = { "output" : pirStatus };
    res.send(output);
});

app.post('/lcd/:text',function(req,res) {
    var text = req.params.text;
    var output = { "output" : "LCD: "+text };
    lcd.clear();
    lcd.println(text.substr(0,16),1);
    lcd.println(text.substr(16,16),2);
    res.send(output);
});

app.post('/camera',function(req,res) {
    var output;
    myCamera.snap()
      .then((result) => {
        output = { "output" : "CAMERA: OK" };
        res.send(output);
      })
      .catch((error) => {
        output = { "output" : "CAMERA: "+error };
        res.send(output);
        message.log(error);
      });
});

app.post('/:led/:state',function(req,res) {
    LED[req.params.led].writeSync(parseInt(req.params.state));
    var output = { "output" : "OK" };
    res.send(output);
});

// Test Camera
myCamera.snap()
  .then((result) => {
  })
  .catch((error) => {
    message.log(err);
  });

var lcd = new LCD( 1, 0x3f, 16, 2 );
// Test LCD
lcd.off();
lcd.clear();
lcd.println("Hello",1);
lcd.println("World",2);
lcd.on();

app.listen(SERVERPORT);

var fs = require('fs')
var readline = require('readline');
var StringBuilder = require('stringbuilder')
var http = require('http')
var zlib = require('zlib')
var sprintf = require("sprintf-js").sprintf
var helper = require('./helpers/webhelper.js')

var data = fs.readFileSync("ctrip.hotels.list.html").toString();
var cnf = data.match(/allRoom.+/)[0];
var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
console.log(url);
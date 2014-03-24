var fs = require('fs')
var readline = require('readline');
var http = require('http')
var zlib = require('zlib')
var sprintf = require("sprintf-js").sprintf
var helper = require('../helpers/webhelper.js')
var url = "http://jing.58.com/adJump?adType=0&target=na33PWNOPjcOnHnzrjbYrjEdsA6YIZTlszqBpB3draOWUvYfXMK_IM-fIyGGIywGmy3fnHEkPHNQrHcvrjmLn1K3sMPCIAd_sjNYrjNYrjN&mobile=-1&useragent=&keywordtactics=0&utm_source=&spm=&isextend=0&disptime=1395224502533&entityid=14055192686730&entitytype=0&params=&local=1&cate=13915&JZEND=END";

//var data = fs.readFileSync("ctrip.hotels.list.html").toString();
//var cnf = data.match(/allRoom.+/)[0];
//var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
//console.log(url);


http.get(url,function(res){
    console.log(res.statusCode);
    var chunks = [];
    res.on('data',function(chunk){
	console.log("get chunk.");
	chunks.push(chunk);
    });
    res.on('end',function(){
	console.log('request end');
	var buffer = Buffer.concat(chunks);
	console.log(buffer.toString());
    });
});
var dgram = require('dgram');

function Collector(){
    this.srvPort=4588;
    this.srvHost='127.0.0.1';
    this.client = null;
}
Collector.prototype.init=function(){
    this.client = dgram.createSocket('udp4'); // ipv4
    this.client.on('message',this.processMsg);
}
Collector.prototype.checkSrv = function(){
    var msg = {};
    msg.type='check';
    this.send(msg);  
}
Collector.prototype.send = function(msg){
    if(!msg) return;
    var message = null;
    if(msg instanceof Object)
	msg = JSON.stringify(msg);
    message = new Buffer(msg);
    this.client.send(message, 0, message.length, this.srvPort, this.srvHost, function(err, bytes) {
	if (err) throw err;
	console.log('UDP message sent');
    });
}
/*
Message Protocol
type:todo|done|failed|proxy|check
data:{}
stat:success|error
*/
Collector.prototype.processMsg=function(msg,remote){
    var message = JSON.parse(msg);
    switch(message.type){
    case 'check':
	if(message.stat=='success'){
	    console.log('server '+ remote.address + ':' + remote.port +' is ready');
	    this.start();
	}
	break;
    case 'todo':
	this.processWork(msg);
	break;
    case 'done':break;
    default:break;
    }
}
/*
type:todo
data:{
uc:app|pc
site:elong|ctrip|qunar
rs:hotel|flight
}
meta:{
city:id,pinyin,cname,code,
date,
star?
}
*/
Collector.prototype.processWork=function(msg){
    if(!msg.meta){
	//done ?
	return;
    }else{
	
    }
}

Collector.prototype.onDone=function(msg){
    msg.type='done';
    this.send(msg);
}
Collector.prototype.start=function(){
    var msg={};
    msg.type='todo';
    msg.data={'uc':'pc','site':'elong','rs':'hotel'};
    this.send(msg);
}
var c = new Collector();
c.init();
c.checkSrv();

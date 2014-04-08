var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var sys = require('sys')
var helper = require('../helpers/webhelper.js')

var flight_list_options = new helper.basic_options("m.ctrip.com",'/restapi/Flight/Domestic/FlightList/Query',"POST",true,true);
var resultFile = "app_ctrip_flight.txt";
var doneFile = "app_ctrip_done_flight.txt";
var logFile = "app_ctrip_flight_log.txt";
var depdate = "2014/05/01";
var cityFile = "qunar_flight_hot_city.txt";

function get_flight_data(){
    this["tabtype"]= 1,
    this["ver"]= 0,
    this["tripType"]= 1,
    this["ticketIssueCty"]="BJS",
    this["flag"]=0,
    this["pageIdx"]= 1,
    this["items"]= [{
	"dCtyCode": "BJS",
	"dCtyId": 1,
	"dcityName": "北京",
	"dkey": 3,
	"aCtyCode": "SHA",
	"aCtyId": 2,
	"acityName": "上海",
	"akey": 2,
	"date": depdate
    }],
    this["_items"]= [{
	"dCtyCode": "BJS",
	"dCtyId": 1,
	"dcityName": "北京",
	"dkey": 3,
	"aCtyCode": "SHA",
	"aCtyId": 2,
	"acityName": "上海",
	"akey": 2,
	"date": depdate
    }],
    this["class"]= 0,
    this["depart-sorttype"]="time",
    this["depart-orderby"]= "asc",
    this["arrive-sorttype"]="time",
    this["arrive-orderby"]="asc",
    this["calendarendtime"]= "2014/06/3000: 00: 00",
    this["__tripType"]=1,
    this["head"]={
	"cid": "cd3b6d6c-3f75-1fef-0930-69061427de9f",
	"ctok": "351858059049938",
	"cver": "1.0",
	"lang": "01",
	"sid": "8888",
	"syscode": "09",
	"auth": ""
    }
};
//var strData = JSON.stringify(get_flight_data);
//flight_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');

var fn = function(flightsInfo,args){
    var flights = flightsInfo&&flightsInfo.count>0&&flightsInfo.items;
    if(!flights) {
	return;
    }
    args[2].idx = 0;//flightsInfo.count;
    var sb = new helper.StringBuffer();
    for(var i=0;i<flights.length;i++){
	var f = flights[i];
	for(var j=0;j<f.cabins.length;j++){
	    sb.append(args[0]);
	    sb.append(',');
	    sb.append(args[1]);
	    sb.append(',');
	    sb.append(f.daname?f.daname:args[0]);
	    sb.append(',');
	    sb.append(f.aaname?f.aaname:args[1]);
	    sb.append(',');
	    sb.append(f.aname+' '+f.flightNo);
	    sb.append(',');
	    sb.append(f.planeType+' '+(f.ctinfo?f.ctinfo.ckind:''));
	    sb.append(',');
	    sb.append(f.dTime);
	    sb.append(',');
	    sb.append(f.aTime);
	    sb.append(',');
	    sb.append(f.cabins[j].discount);
	    sb.append(',');
	    sb.append(f.cabins[j].price);
	    sb.append(',');
	    sb.append(f.cabins[j].class);
	    sb.append(',');
	    sb.append(f.cabins[j].rebateAmt);
	    sb.append(',');
	    sb.append(f.cabins[j].qty);
	    sb.append(',');
	    sb.append(f.puncRate);
	    sb.append('\r\n');
	    
	}
	var str = sb.toString();
	sb.clear();
	fs.appendFile(resultFile,str,{encoding:"utf8"},function(err){
	    if(err) console.log(err);
	    else{
		args[2].idx++;
		console.log(args[0]+"-"+args[1]+" : "+args[2].idx+"/"+flightsInfo.count);
		if(args[2].idx==flightsInfo.count){
		    doneCities[args[0]+'-'+args[1]] = true;
		    fs.appendFileSync(doneFile,args[0]+'-'+args[1]+'\r\n');
		}
	    }
	    //    var p = progress[args[0]];
	    //    if(p){
	    // 	console.log(args[0]+" : "+(++p.doneFlights)+"/"+p.total);
	    // 	if(p.doneFlights==p.total){
	    // 	    doneCities[args[0]]=true;
	    // 	    fs.appendFile(doneFile,args[0]+'\r\n',function(){});
	    // 	}
	    //    }
	    //    if(++doneCount==reqCount)
	    // console.log('got '+doneCount+'/'+reqCount);

	});
    }
}


var cities = [];
var progress = {};
var doneCount=0;
var reqCount=0;
var doneCities={};
var failedCount = 0;

if(fs.existsSync(doneFile)){
    var doneLines = fs.readFileSync(doneFile).toString().split('\r\n');
    if(doneLines){
	for(var i=0;i<doneLines.length;i++){
	    doneCities[doneLines[i]]=true;
	}
    }
}

var lines = fs.readFileSync(cityFile).toString().split('\r\n');
if(lines){
    for(var i=0;i<lines.length;i++){
	var c = lines[i].split(' ');
	var city = {};
	city["code"] = c[2];
	city["cname"] = c[1];
	city["id"] = c[0].match(/\d+/);
	cities.push(city);
    }
    for(var j=0;j<cities.length;j++){
	var dep = cities[j];
	if(doneCities[dep.cname]) continue;
	else
	    progress[dep.cname]={'cur':0,'total':0,'doneFlights':0};
	for(var k=0;k<cities.length;k++){
	    if(k==j) continue;
	    var arr = cities[k];
	    var query = new get_flight_data();
	    query.ticketIssueCty = dep.code;
	    query.items[0].dCtyCode = dep.code;
	    query.items[0].dCtyId = dep.id;
	    query.items[0].dcityName = dep.cname;
	    query.items[0].aCtyCode = arr.code;
	    query.items[0].aCtyId = arr.id;
	    query.items[0].acityName = arr.cname;

	    query._items[0].dCtyCode = dep.code;
	    query._items[0].dCtyId = dep.id;
	    query._items[0].dcityName = dep.cname;
	    query._items[0].aCtyCode = arr.code;
	    query._items[0].aCtyId = arr.id;
	    query._items[0].acityName = arr.cname;
	    helper.request_data(flight_list_options,query,fn,[dep.cname,arr.cname]);
	}
    }
}


function MCtripFlight(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "app_ctrip_flight.txt";
    this.doneFile = "app_ctrip_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.depdate = "2014/05/01";
    this.cityFile = "qunar_flight_hot_city.txt";

    this.citySkip = {};
    this.cities = [];
    this.doneFlights = {};
    this.todoFlights=[];

    this.ctripQuery = function(dname,aname,pidx){
	this["tabtype"]= 1,
	this["ver"]= 0,
	this["tripType"]= 1,
	this["ticketIssueCty"]="BJS",
	this["flag"]=0,
	this["pageIdx"]= 1,
	this["items"]= [{
	    "dCtyCode": "BJS",
	    "dCtyId": 1,
	    "dcityName": "北京",
	    "dkey": 3,
	    "aCtyCode": "SHA",
	    "aCtyId": 2,
	    "acityName": "上海",
	    "akey": 2,
	    "date": depdate
	}],
	this["_items"]= [{
	    "dCtyCode": "BJS",
	    "dCtyId": 1,
	    "dcityName": "北京",
	    "dkey": 3,
	    "aCtyCode": "SHA",
	    "aCtyId": 2,
	    "acityName": "上海",
	    "akey": 2,
	    "date": depdate
	}],
	this["class"]= 0,
	this["depart-sorttype"]="time",
	this["depart-orderby"]= "asc",
	this["arrive-sorttype"]="time",
	this["arrive-orderby"]="asc",
	this["calendarendtime"]= "2014/06/3000: 00: 00",
	this["__tripType"]=1,
	this["head"]={
	    "cid": "cd3b6d6c-3f75-1fef-0930-69061427de9f",
	    "ctok": "351858059049938",
	    "cver": "1.0",
	    "lang": "01",
	    "sid": "8888",
	    "syscode": "09",
	    "auth": ""
	}
    }
}

MCtripFlight.prototype.init = function(){
    this.cities = helper.get_cities(this.dataDir+this.cityFile);
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.cities.length;j++){
	    if(i==j)
		continue;
	    var n = this.cities[i].cname+'-'+this.cities[j].cname;
	    if(!this.doneFlights[n] && !this.citySkip[n])
		this.todoFlights.push({
		    d:this.cities[i].cname,
		    a:this.cities[j].cname
		});
	}
    }
}

MCtripFlight.prototype.start = function(){
    this.load();
    this.init();
    console.log("%d flights todo.",this.todoFlights.length);
    this.todoFlights.forEach(function(f,i,a){
	this.wgetList(f);
    },this);
//    this.wgetList(this.todoFlights[0]);
}

MCtripFlight.prototype.load = function(){
    if(fs.existsSync(this.resultDir+this.doneFile)){
	fs.readFileSync(this.resultDir+this.doneFile)
	    .toString()
	    .split('\r\n')
	    .reduce(function(pre,cur){
		if(cur)
		    pre[cur]=true;
		return pre;
	    },this.doneFlights);
    }
    if(fs.existsSync(this.dataDir+this.skipFile)){
	fs.readFileSync(this.dataDir+this.skipFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,cur){
		if(cur){
		    cur = cur.replace('\r','');
		    pre[cur]=true;
		}
		return pre;
	    },this.citySkip);
    }
}

MCtripFlight.prototype.processList = function(data,args){
    
}

MCtripFlight.prototype.wgetList = function(f){
    console.log("GET %s-%s: %d/%d",f.d,f.a,f.pageIdx,f.pageCount);
    var query = new this.ctripQuery(f.d,f.a,f.pageIdx);
    var opt = new helper.basic_options("m.ctrip.com",'/restapi/Flight/Domestic/FlightList/Query',"POST",true,true);
    helper.request_data(opt,query,function(data,args){
	that.processList(data,args);
    },f);
}


var instance = new MCtripFlight();
var that = instance;
instance.start();
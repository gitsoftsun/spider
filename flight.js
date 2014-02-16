var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var sys = require('sys')
var helper = require('./helpers/webhelper.js')

var flight_list_options = new helper.basic_options("m.ctrip.com",'/restapi/Flight/Domestic/FlightList/Query',"POST",true,true);

var get_flight_data={
	"tabtype": 1,
	"ver": 0,
	"tripType": 1,
	"ticketIssueCty": "BJS",
	"flag": 0,
	"pageIdx": 1,
	"items": [{
		"dCtyCode": "BJS",
		"dCtyId": 1,
		"dcityName": "北京",
		"dkey": 3,
		"aCtyCode": "SHA",
		"aCtyId": 2,
		"acityName": "上海",
		"akey": 2,
		"date": "2014/02/23"
	}],
	"_items": [{
		"dCtyCode": "BJS",
		"dCtyId": 1,
		"dcityName": "北京",
		"dkey": 3,
		"aCtyCode": "SHA",
		"aCtyId": 2,
		"acityName": "上海",
		"akey": 2,
		"date": "2014/02/23"
	}],
	"class": 0,
	"depart-sorttype": "time",
	"depart-orderby": "asc",
	"arrive-sorttype": "time",
	"arrive-orderby": "asc",
	"calendarendtime": "2014/06/3000: 00: 00",
	"__tripType": 1,
	"head": {
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
    if(progress[args[0]]){
	progress[args[0]].total+=flights.length;
	reqCount+=flights.length;
    }
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
	fs.appendFile("flightresult.txt",str,{encoding:"utf8"},function(err){
	    if(err) console.log(err);

	    var p = progress[args[0]];
	    if(p){
		
		console.log(args[0]+" : "+(++p.doneFlights)+"/"+p.total);
		if(p.doneFlights==p.total){
		    doneCities[args[0]]=true;
		    fs.appendFile("doneFc.txt",args[0]+'\r\n',function(){});
		}
	    }
	    if(++doneCount==reqCount)
		console.log('got '+doneCount+'/'+reqCount);

	});
    }
}
function request_data(opts,data,fn,args){
    if(!opts || !fn) throw "argument null 'opt' or 'data'";
    var strData = JSON.stringify(data);
    opts.headers['Content-Length']=Buffer.byteLength(strData);
    
    var req = http.request(opts, function(res) {

	var chunks=[];
	res.on('data', function (chunk) {
            chunks.push(chunk);
	});
	res.on('end',function(){
            if(res.headers['content-encoding']=='gzip'){
		var buffer = Buffer.concat(chunks);
		zlib.gunzip(buffer,function(err,decoded){
		    if(decoded){
			try{
			    var obj =JSON.parse(decoded.toString());
			    fn(obj,args);
			}
			catch(e){
			    console.log(e.message);
			    //retry once.
			   // setTimeout(function(){
			//	request_data(opts,data,fn,args);		
			  //  },2000);
			}
		    }
		});
            }
	});
    });
    req.on('error', function(e) {
	console.log('problem with request: ' + e.message);
    });
    req.write(strData);
    req.end();
}

var cities = [];
var progress = {};
var doneCount=0;
var reqCount=0;
var doneCities={};
var failedCount = 0;
if(fs.existsSync("doneFc.txt")){
    var doneLines = fs.readFileSync("doneFc.txt").toString().split('\r\n');
    if(doneLines){
	for(var i=0;i<doneLines.length;i++){
	    doneCities[doneLines[i]]=true;
	}
    }
}

var lines = fs.readFileSync("fc.txt").toString().split('\r\n');
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
	    get_flight_data.ticketIssueCty = dep.code;
	    get_flight_data.items[0].dCtyCode = dep.code;
	    get_flight_data.items[0].dCtyId = dep.id;
	    get_flight_data.items[0].dcityName = dep.cname;
	    get_flight_data.items[0].aCtyCode = arr.code;
	    get_flight_data.items[0].aCtyId = arr.id;
	    get_flight_data.items[0].acityName = arr.cname;

	    get_flight_data._items[0].dCtyCode = dep.code;
	    get_flight_data._items[0].dCtyId = dep.id;
	    get_flight_data._items[0].dcityName = dep.cname;
	    get_flight_data._items[0].aCtyCode = arr.code;
	    get_flight_data._items[0].aCtyId = arr.id;
	    get_flight_data._items[0].acityName = arr.cname;
	    request_data(flight_list_options,get_flight_data,fn,[dep.cname,arr.cname]);
	}
    }
}

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then substring() 
    console.log("you entered: [" + 
        d.toString().substring(0, d.length-1) + "]");
    process.exit(0);
  });

//request_data(flight_list_options,get_flight_data,fn);

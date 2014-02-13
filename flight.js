var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')

var flight_list_options = new helper.basic_options();
flight_list_options.path = '/restapi/Flight/Domestic/FlightList/Query';


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
var strData = JSON.stringify(get_flight_data);
flight_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        
var req = http.request(flight_list_options, function(res) {
    //res.setEncoding('utf8');
    var chunks=[];
    res.on('data', function (chunk) {
        chunks.push(chunk);
    });
    res.on('end',function(){
        if(res.headers['content-encoding']=='gzip'){
        var buffer = Buffer.concat(chunks);
        zlib.gunzip(buffer,function(err,decoded){
            if(decoded){
            console.log(JSON.parse(decoded.toString()));
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
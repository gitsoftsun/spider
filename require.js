var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var readline = require('readline');

var options = {
	host:'m.ctrip.com',
	path:'/html5/Hotel/GetHotelList',
	port:80,
	method:'POST',
	headers: {
		'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
		"X-Requested-With":"XMLHttpRequest",
		"Accept":"application/json, text/javascript, */*; q=0.01",
		"Accept-Encoding":"gzip, deflate",
		"Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
		"Content-Type":"application/json",
		"X_FORWARDED_FOR":"58.99.128.66",
	}
};
var requestData = {"CheckInCityID":"2","CheckInCity":"上海","isHot":2,"OrderName":0,"OrderType":1,"CheckInDate":"2014-02-23","PageNumber":1,"CheckOutDate":"2014-02-24","Days":"1","KeyWord":"","DistrictId":-1,"ZoneName":"","Zone":"","Location":"","LocationName":"","MetroId":"","MetroName":"","BrandId":"","BrandName":"","IsMorning":"0","isYesterdayOrder":false,"Star":""};

//get cities from file
var stream = fs.createReadStream("TextFile1.txt");
var rl = readline.createInterface({
    input:stream,
    output:process.stdout
});
var cities={};
var doneCities={};
rl.on('line',function(line){
    if(!line) return;
    var pah = line.split(' ');
    var id = Number(pah[0].match(/\d+/));
    var name = pah[1];
    cities[id]=name;
});

for(var k in cities){
    var c = cities[k];
    requestData["CheckInCityID"]=k;
    requestData["CheckinCity"]=c;
    requestData["PageNumber"]=1;
    get_res_data(requestData,one_page_data);
    doneCities[k]=true;
}
var pageCount=1;
var curPageIdx=1;
var hotels=[];
var hotel=function(){
    this.id = 0;
    this.name = "";
    this.shortName = "";
    this.star="";
    this.currency = "";
    this.lowPrice="";
    this.points="";
    this.zoneName="";
    this.isGift=false;
    this.isNew=false;
    this.isFan=false;
    this.fanPrice=0;
    this.fanType="";
    this.isQuan=false;
    this.quanPrice=0;
    this.quanType="";
    this.isCu = false;
    this.isMp=false;
    this.isMorning=false;
    this.isStar=false;
    this.isRoomFull=false;
};




function one_page_data(obj){
    var fileds = obj.Data[0];// array 
    var data_arr = obj.Data[1];
    var hotelList = data_arr[0];
    var totalCount = data_arr[1];
    pageCount = data_arr[2];
    var currentPos = data_arr[3];
    var isInterested = data_arr[4];
    for(var i=0;i<hotelList.length;i++){
	var h = new hotel();
	var h_arr = hotelList[i];
	h.id=h_arr[0];
	h.name=h_arr[2];
	h.shortName=h_arr[3];
	h.star = h_arr[5];
	h.currency=h_arr[6];
	h.lowPrice=h_arr[7];
	h.points = h_arr[8];
	h.zoneName = h_arr[9];
	h.isGift = h_arr[10]==1?true:false;
	h.isNew = h_arr[11]==1?true:false;
	h.isFan = h_arr[12]==1?true:false;
	h.fanPrice=h_arr[13];
	h.isQuan = h_arr[14]==1?true:false;
	h.quanPrice = h_arr[15];
	h.quanType = h_arr[16];
	h.isCu = h_arr[17]==1?true:false;
	h.isMp=h_arr[18]==1?true:false;
	h.isMorning=h_arr[19]==1?true:false;
	h.isStar = h_arr[20]==1?true:false;
	hotels.push(h);
    }
    while(curPageIdx<pageCount){
	
    }
}


function get_res_data(json_data,fn){
    var strData = JSON.stringify(json_data);
    options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
    var req = http.request(options, function(res) {
	console.log('STATUS: ' + res.statusCode);
	console.log('HEADERS: ' + JSON.stringify(res.headers));
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
  			fn(JSON.parse(decoded.toString()));
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





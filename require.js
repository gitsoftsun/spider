var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var StringBuilder = require('stringbuilder')
var sys = require('sys')

var hotel_list_options = {
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
var hotel_detail_options={
    host:'m.ctrip.com',
    path:'/html5/Hotel/GetHotelDetail',
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
requestData.clone=function(){
    var result = {};
    result["CheckInCityID"]=this["CheckInCityID"];
    result["CheckInCity"]=this["CheckInCity"];
    result["isHot"]=this["isHot"];
    result["OrderName"]=this["isHot"];
    result["OrderType"]=this["isHot"];
    result["CheckInDate"]=this["CheckInDate"];
    result["PageNumber"] = this["PageNumber"];
    result["CheckOutDate"]=this["CheckOutDate"];
    result["Days"]=this["Days"];
    result["DistrictId"]=this["DistrictId"];
    result["IsMorning"]=this["IsMorning"];
    result["isYesterdayOrder"]=this["isYesterdayOrder"];

    return result;
};

var requestDetailData = {
    "CheckInDate": "2014-02-13"
    "CheckOutDate": "2014-02-14"
    "CityID": "2"
    "HotelID": "425179"
    "IsMorning": "0"
};
//get cities from file

var cities={};
var doneCities={};
var curCity=0;
var doneCityCount=0;
var cityCount=0;
fs.readFileSync('TextFile1.txt').toString().split("\r\n").forEach(function(line){
    var pyh = line.split(' ');
    var id = pyh[0].match(/\d+/);
    var name = pyh[1];
    cities[id]={"name":name,pageCount:1,curPageIdx:1,rd:null,gotPageIdx:0};
    cityCount++;
});

var pageCount=1;
var curPageIdx=1;
var hotels=[];
var hotel=function(){
    this.city=0;
    this.id = 0;
    this.name = "";
    this.shortName = "";
    this.star=0;
    this.currency = "";
    this.lowPrice="";
    this.points="";
    this.zoneName="";

    this.commentCount=0;

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

    this.rooms = [];
};
var room = function(){
    this.id=0;
    this.name="";
    this.price=0;
    this.breakfast="";
};
hotel.prototype.appendToFile=function(){
    var sb = new StringBuilder({newline:'\r\n'});
    for(var i=0;i<this.rooms.length;i++){
        sb.append(this.city);
        sb.append(",");
        sb.append(this.name);
        sb.append(",");
        sb.append(this.star);
        sb.append(",");
        sb.append(this.rooms[i].name);
        sb.append(",");
        sb.append(this.rooms[i].price);
        sb.append(",");
        sb.append(this.commentCount);
        sb.append(",");
        sb.append(this.points);
        sb.append(",");
        sb.append(this.rooms[i].breakfast);
        sb.append(",");
        sb.append(this.isGift);
        sb.append(",");
        sb.append(this.isCu);
        sb.append(",");
        sb.append(this.isFan&&this.fanPrice);
        sb.append('\r\n');
    }
    sb.append(this.city+","+this.name+","+this.star+","+this.isCu+"\r\n");
    sb.build(function(err,result){
        if(err) {
            console.log(err);
            return;
        }
        fs.appendFileSync("data.txt",result);
    });
    
}


for(var k in cities){
    var c = cities[k];
    c["rd"] = requestData.clone();
    c["rd"]["CheckInCityID"]=k;
    c["rd"]["CheckinCity"]=c.name;
    c["rd"]["PageNumber"]=1;
    console.log("getting "+c.name+"...")
    get_res_data(c["rd"],one_page_data);
    doneCities[k]=true;
}

function hotel_page_data(obj){

}

function one_page_data(obj,cityId){
    var fileds = obj&&obj.Data&&obj.Data[0];// array 
    var data_arr = obj&&obj.Data&&obj.Data[1];
    if(!data_arr) return;
    var hotelList = data_arr[0];
    var totalCount = data_arr[1];
    cities[cityId].pageCount = data_arr[2];
    var currentPos = data_arr[3];
    var isInterested = data_arr[4];
    for(var i=0;i<hotelList.length;i++){
	var h = new hotel();
	var h_arr = hotelList[i];
    h.city=cities[cityId]&&cities[cityId].name;
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
    //console.log(cities[cityId].name+" total page count:"+cities[cityId].pageCount);
    if(cities[cityId].curPageIdx==cities[cityId].pageCount) {
        doneCityCount++;
        if(doneCityCount==cityCount){
            //saveFile();
        }
    }

    console.log("got "+cities[cityId].curPageIdx+++"/"+cities[cityId].pageCount);
    while(cities[cityId]["rd"]["PageNumber"]<cities[cityId].pageCount){
        //++cities[cityId].curPageIdx;
        cities[cityId]["rd"]["PageNumber"]++;
        get_res_data(cities[cityId]["rd"],one_page_data);
    }
}

function saveFile(){
    console.log("starting saving files...");
    hotels.forEach(function(h){
        h.appendToFile();
    });
}

function get_res_data(json_data,fn,type="list"){
    var strData = JSON.stringify(json_data);
    var options=null;
    if(type=="list"){
        hotel_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        options=hotel_list_options;
    }
        
    else{
        hotel_detail_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        options=hotel_detail_options;
    }
        
    var req = http.request(options, function(res) {
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
  			fn(JSON.parse(decoded.toString()),json_data['CheckInCityID']);
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




var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then substring() 
    console.log("you entered: [" + 
        d.toString().substring(0, d.length-1) + "]");
    process.exit(0);
  });
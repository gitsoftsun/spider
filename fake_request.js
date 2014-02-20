var fs = require('fs')
var readline = require('readline');
var StringBuilder = require('stringbuilder')
var http = require('http')
var zlib = require('zlib')
var sprintf = require("sprintf-js").sprintf
var helper = require('./helpers/webhelper.js')

helper.verifyproxy('all_proxy_unverify4.txt');

//var options = new helper.basic_options('m.qunar.com','/','GET',true,false,null);
function getdata(){
    http.get(options,function(res){
    var chunks = [];
    res.on('data',function(chunk){
        chunks.push(chunk);
    });
    res.on('end',function(){
        var buffer = Buffer.concat(chunks);
    console.log(buffer.length);
    });
});

}

//console.log(sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', "cracker", "Polly", "wants",3));
// var cities={};
// fs.readFileSync('TextFile1.txt').toString().split("\r\n").forEach(function(line){
// 	var pyh = line.split(' ');
// 	var id = pyh[0].match(/\d+/);
// 	var name = pyh[1];
// 	cities[id]=name;
// });
// console.log(cities);
// var sb = new StringBuilder();

// sb.append("fdfds");
// sb.append(",");
// sb.appendLine();
// sb.build(function(err,result){
// 	console.log(result);
// });
// var hotel_detail_options={
//     host:'m.ctrip.com',
//     path:'/html5/Hotel/GetHotelDetail',
//     port:80,
//     method:'POST',
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
//         "X-Requested-With":"XMLHttpRequest",
//         "Accept":"application/json, text/javascript, */*; q=0.01",
//         "Accept-Encoding":"gzip, deflate",
//         "Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
//         "Content-Type":"application/json",
//         "X_FORWARDED_FOR":"58.99.128.66",
//     }
// };
// var requestDetailData = function(cityId,hotelId){
//     this.CheckInDate= "2014-02-23";
//     this.CheckOutDate="2014-02-24";
//     this.CityID= cityId;
//     this.HotelID= hotelId;
//     this.IsMorning= "0";
// };

// var rd = new requestDetailData("2",425161);
// get_res_data(rd,function(obj){
// 	obj = obj&&obj.Data;
// 	obj = JSON.CtripUnPack(obj);
// 	console.log(obj[0].RoomDetailList);
// },"detail");

// function get_res_data(json_data,fn,type){
//     var strData = JSON.stringify(json_data);
//     var options=null;
//     if(type=="detail"){
//     	hotel_detail_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
//         options=hotel_detail_options;
        
//     }
//     else{
//         hotel_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
//         options=hotel_list_options;
//     }
        
//     var req = http.request(options, function(res) {
// 	//res.setEncoding('utf8');
// 	var chunks=[];
// 	res.on('data', function (chunk) {
// 	    chunks.push(chunk);
// 	});
// 	res.on('end',function(){
//   	    if(res.headers['content-encoding']=='gzip'){
//   		var buffer = Buffer.concat(chunks);
//   		zlib.gunzip(buffer,function(err,decoded){
// 		    if(decoded){
//   			fn(JSON.parse(decoded.toString()),json_data['CheckInCityID']);
// 		    }
//   		});
// 	    }
// 	});
//     });
//     req.on('error', function(e) {
// 	console.log('problem with request: ' + e.message);
//     });
//     req.write(strData);
//     req.end();
// }

// var hotels=[];
// var hotel=function(){
//     this.city=0;
//     this.id = 0;
//     this.name = "";
//     this.shortName = "";
//     this.star=0;
//     this.currency = "";
//     this.lowPrice="";
//     this.points="";
//     this.zoneName="";

//     this.commentCount=0;

//     this.isGift=false;
//     this.isNew=false;
//     this.isFan=false;
//     this.fanPrice=0;
//     this.fanType="";
//     this.isQuan=false;
//     this.quanPrice=0;
//     this.quanType="";
//     this.isCu = false;
//     this.isMp=false;
//     this.isMorning=false;
//     this.isStar=false;
//     this.isRoomFull=false;

//     this.rooms = [];
// };
// var room = function(){
//     this.id=0;
//     this.name="";
//     this.price=0;
//     this.breakfast="";
// };
// var pageCount=1;
// var curPageIdx=1;

// var file = fs.readFile("response_format.json","utf8",function(err,data){
// 	if(err)
// 		return console.log(err);
// 	var obj = JSON.parse(data);
// 	var fileds = obj.Data[0];// array 
// 	var data_arr = obj.Data[1];
// 	var hotelList = data_arr[0];
// 	var totalCount = data_arr[1];
// 	pageCount = Number(data_arr[2]);
// 	var currentPos = data_arr[3];
// 	var isInterested = data_arr[4];
// 	for(var i=0;i<hotelList.length;i++){
// 	    var h = new hotel();
// 	    var h_arr = hotelList[i];
// 	    h.id=h_arr[0];
// 	    h.name=h_arr[2];
// 	    h.shortName=h_arr[3];
// 	    h.star = h_arr[5];
// 	    h.currency=h_arr[6];
// 	    h.lowPrice=h_arr[7];
// 	    h.points = h_arr[8];
// 	    h.zoneName = h_arr[9];
// 	    h.isGift = h_arr[10]==1?true:false;
// 	    h.isNew = h_arr[11]==1?true:false;
// 	    h.isFan = h_arr[12]==1?true:false;
// 	    h.fanPrice=h_arr[13];
// 	    h.isQuan = h_arr[14]==1?true:false;
// 	    h.quanPrice = h_arr[15];
// 	    h.quanType = h_arr[16];
// 	    h.isCu = h_arr[17]==1?true:false;
// 	    h.isMp=h_arr[18]==1?true:false;
// 	    h.isMorning=h_arr[19]==1?true:false;
// 	    h.isStar = h_arr[20]==1?true:false;
// 	    hotels.push(h);
// 	}
	
// 	console.log(hotels.length);//HotelLists
// 	console.log(totalCount);//TotalCount
// //	console.log(totalPage);//TotalPage
// 	console.log(currentPos);//currentPos
// 	console.log(isInterested);//isInterested

    
// });

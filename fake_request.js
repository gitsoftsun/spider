var fs = require('fs')
var readline = require('readline');
var StringBuilder = require('stringbuilder')
var http = require('http')
var zlib = require('zlib')
var sprintf = require("sprintf-js").sprintf
var helper = require('./helpers/webhelper.js')
//console.log("pre call exit.")
//process.exit()
//console.log("exited");
var q={};
//q["aioIndex"]= "-1"
//q["aioVal"]= ""
//q["citynameen"]= "xxx"
//q["hotelIds"]= "30201106,30201096,40201167,40201027,40201982,40201904,30201068,50201489,40201944,60201579"
//q["isSquare"]= false
// q["viewpath"]= "~/Views/HotelListC/hotellist"
// q["hsr.ApCardNo"]= ""
// q["hsr.AreaId"]= ""
// q["hsr.AreaName"]= ""
// q["hsr.AreaType"]= 0
// q["hsr.BookingenableRate"]= 92
// q["hsr.BrandId"]= 0
// q["hsr.BrandIds"]= ""
// q["hsr.BrandName"]= ""
// q["hsr.Campaign_Id"]= ""
// q["hsr.CardNo"]= "192928"
// q["hsr.ChannelCode"]= "0000"
q["hsr.CheckInDate"]= "2014/2/23"
q["hsr.CheckOutDate"]= "2014/2/24"
q["hsr.CityId"]= "1111"
// q["hsr.CityName"]= "上海"
// q["hsr.DetailNoResultCache"]= false
// q["hsr.Distance"]= 20
// q["hsr.EndLat"]= 0
// q["hsr.EndLng"]= 0
// q["hsr.FacilityIds"]= ""
// q["hsr.HighPrice"]= 0
// q["hsr.HotelChannel"]= "Hotel"
// q["hsr.HotelCount"]= 3743
// q["hsr.HotelName"]= ""
// q["hsr.HotelSort"]= "ByDefault"
// q["hsr.IsBigBed"]= false
// q["hsr.IsCashback"]= false
// q["hsr.IsCoupon"]= false
// q["hsr.IsDoubleBed"]= false
// q["hsr.IsFreeBreakfast"]= false
// q["hsr.IsFreeNet"]= false
// q["hsr.IsLimitTime"]= false
// q["hsr.IsLogin"]= false
// q["hsr.IsMystical"]= false
// q["hsr.IsNeedFilterProduct"]= false
// q["hsr.IsNeedNotContractedHotel"]= true
// q["hsr.IsNoGuarantee"]= false
// q["hsr.IsNotAcceptRecommend"]= false
// q["hsr.IsNotChange"]= false
// q["hsr.IsNotReturnNoRoomHotel"]= false
// q["hsr.IsPrePay"]= false
// q["hsr.Keywords"]= ""
// q["hsr.KeywordsType"]= "None"
// q["hsr.Language"]= "CN"
// q["hsr.ListType"]= "Common"
// q["hsr.LowPrice"]= 0
// q["hsr.MemberLevel"]= "Common"
// q["hsr.NationalCityName"]= "上海"
// q["hsr.OrderFromId"]= 50
// q["hsr.PageIndex"]= 1
// q["hsr.PageSize"]= 10
// q["hsr.PaymentType"]= "All"
// q["hsr.PersonNumOfRoom"]= 0
// q["hsr.PoiId"]= 0
// q["hsr.PoiName"]= ""
// q["hsr.RankType"]= 0
// q["hsr.ReturnKeywords"]= ""
// q["hsr.ReturnKeywordsType"]= "None"
// q["hsr.ShowPageSize"]= 40
// q["hsr.StarLevel"]= "None"
// q["hsr.StarLevels"]= ""
// q["hsr.StartLat"]= 0
// q["hsr.StartLng"]= 0
// q["hsr.SupplierIds"]= ""
// q["hsr.TagId"]= ""
// q["hsr.ThemeIds"]= ""
q["hotelId"]=41111001
//helper.fetchProxys();
//helper.verifyproxy('all_proxy_unverify.txt','verified-2-23.txt');
var elong_query = function(dname,aname){
this.DepartCityName=dname;
this.ArrivalCityName=aname;
this.DepartDate="2014/2/26";
this.IsReturn="false";
this.PageIndex = 0;
this.FlightType='OneWay';
};
var options = new helper.basic_options('flight.elong.com','/isajax/OneWay/S','GET',false,true,new elong_query('北京','上海'));
options.headers["referer"] = "http://flight.elong.com/";
helper.request_data(options,null,function(data){console.log(data);});
// function getdata(){
//     http.get(options,function(res){
//     var chunks = [];
//     res.on('data',function(chunk){
//         chunks.push(chunk);
//     });
//     res.on('end',function(){
//         var buffer = Buffer.concat(chunks);
//     console.log(buffer.toString());
//     });
//     res.on('error',function(e){
//         console.log(e.message);
//     });
// });

// }

// var query = "?_=1393076714087&isSquare=false&citynameen=zhangjiagang&viewpath=~%2FViews%2FHotelListC%2Fhotellist.aspx&hsr.RankType=-1&hsr.CityId=1111&hsr.CityName=%E5%BC%A0%E5%AE%B6%E6%B8%AF%EF%BC%88%E8%8B%8F%E5%B7%9E%EF%BC%89&hsr.NationalCityName=%E5%BC%A0%E5%AE%B6%E6%B8%AF%EF%BC%88%E8%8B%8F%E5%B7%9E%EF%BC%89&hsr.CheckInDate=2014%2F2%2F24+0%3A00&hsr.CheckOutDate=2014%2F2%2F25+0%3A00&hsr.HotelName=&hsr.Keywords=&hsr.KeywordsType=None&hsr.ReturnKeywordsType=None&hsr.ReturnKeywords=&hsr.AreaId=&hsr.AreaName=&hsr.AreaType=0&hsr.PoiId=0&hsr.PoiName=&hsr.LowPrice=0&hsr.HighPrice=0&hsr.StarLevel=None&hsr.BrandId=0&hsr.BrandName=&hsr.StarLevels=&hsr.BrandIds=&hsr.TagId=&hsr.FacilityIds=&hsr.SupplierIds=&hsr.Distance=20&hsr.StartLat=0&hsr.StartLng=0&hsr.EndLat=0&hsr.EndLng=0&hsr.IsBigBed=false&hsr.IsDoubleBed=false&hsr.IsFreeBreakfast=false&hsr.IsFreeNet=false&hsr.IsCoupon=false&hsr.IsCashback=false&hsr.IsNoGuarantee=false&hsr.IsPrePay=false&hsr.PaymentType=All&hsr.IsLimitTime=false&hsr.IsNotReturnNoRoomHotel=false&hsr.ThemeIds=&hsr.HotelSort=ByDefault&hsr.PageIndex=2&hsr.PageSize=10&hsr.ShowPageSize=40&hsr.HotelCount=61&hsr.ListType=Common&hsr.Language=CN&hsr.CardNo=192928&hsr.MemberLevel=Common&hsr.ApCardNo=&hsr.Campaign_Id=&hsr.ChannelCode=0000&hsr.OrderFromId=50&hsr.PersonNumOfRoom=0&hsr.HotelChannel=Hotel&hsr.IsNotAcceptRecommend=false&hsr.IsNotChange=false&hsr.IsMystical=false&hsr.DetailNoResultCache=false&hsr.IsNeedNotContractedHotel=true&hsr.BookingenableRate=81&hsr.IsLogin=false&hsr.IsNeedFilterProduct=false";
// //var query = "citynameen=zhangjiagang&hsr.CityId=1111&hsr.CityName=%E5%BC%A0%E5%AE%B6%E6%B8%AF%EF%BC%88%E8%8B%8F%E5%B7%9E%EF%BC%89";
// var op = {"host":"hotel.elong.com","path":"/isajax/List/Search"+helper.toQuery(q)};
// op.headers={};
// op.headers["X-Requested-With"]="XMLHttpRequest";
// op.headers["referer"]="http://hotel.elong.com/";
// http.get(op,function(res){
//     var chunks = [];
//     res.on('data',function(chunk){
//         chunks.push(chunk);
//     });
//     res.on('end',function(){
//         var buffer = Buffer.concat(chunks);
//         console.log(buffer.toString());
//     });
// });



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



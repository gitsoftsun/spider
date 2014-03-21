var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')
var sprintf = require("sprintf-js").sprintf

//basic settings.
var checkindate = "2014/04/01";
var checkoutdate = "2014/04/02";
var arguments = process.argv.splice(2);
var level = '';
useproxy = arguments[0]!=undefined;
var resultFile = "pc_elong_hotel-"+level+".txt";
var countOfHotelsPerCity=10;
var doneFile = "pc_elong_done_hotel.txt";
var proxyFile = "verified-2-25.txt";


var pageSize=10;
if(useproxy){
  var proxy = new helper.proxy();
  proxy.load(proxyFile);
  requestCount=0;
}
function getProxy(){
  requestCount++;
  if(requestCount==50){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}
//get cities
var cities = helper.get_cities('elong_hot_city.txt');
console.log('program start.');
//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
for(var i=0;i<cities.length;i++){
	var c = cities[i];
	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
	//var query = {'getHotelListReq':req};
	var query = {};
	query["hsr.CheckInDate"]= checkindate;
	query["hsr.CheckOutDate"]= checkoutdate;
	query["hsr.CityId"]= c.id;
	query["hsr.PageIndex"]=1;
	query["hsr.StarLevels"]=level;
	query["hsr.PageSize"]=pageSize;
	var opt = null;
	if(useproxy){
		var p = getProxy();
		opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/List/Search","GET",false,true,query,p.port);
	}else{
		opt = new helper.basic_options('hotel.elong.com',"/isajax/List/Search",'GET',false,true,query);
	}
	
	opt.headers["referer"] = "http://hotel.elong.com/";
	//console.log("starting get "+c.cname+" page:"+pageIdx);
	helper.request_data(opt,null,process_hotel_list,c);
}

//process response
var hotels={};
function process_hotel_list(data,args){

	if(!data||!data.success)
		return;
	//get hotel list data
	//get next page.
		var c = args[0];
		if(!c.pageCount) c.pageCount = data.value.PageInfo.PageCount;
		if(!c.curPageIdx) c.curPageIdx = data.value.PageInfo.PageIndex;
		if(!c.hotelCount) c.hotelCount=data.value.PageInfo.TotalRow;
		if(c.curHotelIdx==undefined) c.curHotelIdx=0;
	
	for(var i=0;i<data.value.ListStaticInfos.length;i++){
		var item = data.value.ListStaticInfos[i];
		var h = new entity.hotel();
		h.id = item.HotelId+'';
		h.name = item.HotelNameCn;
		h.city = args[0].cname;
		h.star = item.Star;
		h.prate = item.CommentGoodRate;
		h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
		h.commentCount = item.TotalComment;
		h.goodComment = 0;
		h.badComment = 0;
		var opt = null;
		var query = {'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id};
		if(useproxy){
			var p = getProxy();
			opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomset","GET",false,true,query,p.port);
		}else{
			opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,query);
		}
		
		opt.headers["referer"] = "http://hotel.elong.com/";
		helper.request_data(opt,null,process_one_hotel,[h,args[0]]);
	}
	//console.log("done "+args[0].cname+": "+args[1]["hsr.PageIndex"]+"/"+c.pageCount);
	while(c.curPageIdx<c.pageCount){
		c.curPageIdx++;
		//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,c.curPageIdx);
		//var query = {'getHotelListReq':req};
		var query = {};
		query["hsr.CheckInDate"]= checkindate;
		query["hsr.CheckOutDate"]= checkoutdate;
		query["hsr.CityId"]= args[0].id;
		query["hsr.PageIndex"]=c.curPageIdx;
		var opt = null;
		if(useproxy){
			var p = getProxy();
			opt = new helper.basic_options(p.host,'http://hotel.elong.com/isajax/List/Search',"GET",false,true,query,p.port);
		}else{
			opt = new helper.basic_options('hotel.elong.com','/isajax/List/Search','GET',false,true,query);
		}
		
		opt.headers["referer"] = "http://hotel.elong.com/";
		helper.request_data(opt,null,process_hotel_list,c);
	}
}

function process_one_hotel(data,args){
	if(!data||!data.success)
		return;
	if(!data.value.HotelRoomList) {
		console.log("hotel data unavaliable");
		return;
	}
	for(var i=0;i<data.value.HotelRoomList.length;i++){
		var room = data.value.HotelRoomList[i];
		var r = new entity.room();
		r.name = room.RoomName.replace(/,/g,'');
		r.bedType = room.Bed;
		r.plans=[];
		for(var j = 0;j<room.RatePlanList.length;j++){
			var plan = room.RatePlanList[j];
			var p={};
			p.name = plan.RatePlanName;
			p.price = plan.FavorablePrice;
			p.timeLimit = plan.ProductType==16?'Y':'N';
			p.breakfast = plan.Brkfast;
			p.gift = plan.SupplierActivityList.replace(/<\/?[^>]*>/g,'').replace(/[ | ]*[\r\n]*/g,'').replace(/\s/g,'');
			p.reduce = plan.ReduceAmount;
			p.fan  =plan.CouponAmount;
			p.payType = plan.IsPrepay?"Y":"N";
			p.lan = room.Net;
			p.hasWeifang = plan.HasWeifang?'Y':'N';//今日特价
			p.needSurety = plan.NeedSurety?'Y':'N';//担保
			r.plans.push(p);
		}
		args[0].rooms.push(r);
	}

	fs.appendFile(resultFile,args[0].toString("elong_pc"),function(err){
		if(err){
			console.log();
		}else{
			fs.appendFile(doneFile,args[0].id+'\r\n',function(){});
			console.log(args[1].cname+" : "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
		}
	});
}
function process_one_hotel_info(data,args){
	var jdata = JSON.parse(data);
	args[0].goodComment = jdata.GoodComment;
	args[0].badComment = jdata.BadComment;
	//console.log('writting file : '+args[0].id);
	fs.appendFile(resultFile,args[0].toString("elong_pc"),function(err){
		if(err){
			console.log();
		}else{
			fs.appendFile(doneFile,args[0].id+'\r\n',function(){});
			console.log(args[1].cname+" : "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
		}
	});
	//appendToFile(resultFile,args[0].toString("elong_pc"));
}
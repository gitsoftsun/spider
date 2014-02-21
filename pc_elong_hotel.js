var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')
var sprintf = require("sprintf-js").sprintf

//basic settings.
var checkindate = "2014-02-23";
var checkoutdate = "2014-02-24";


//get cities
var cities = helper.get_cities('fc.txt');

//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
for(var i=0;i<cities.length;i++){
	var c = cities[i];
	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
	//var query = {'getHotelListReq':req};
	var query={};
	var opt = new helper.basic_options('hotel.elong.com','/isajax/List/GetSimpleHotelRoomSet','POST',false,true,query);
	helper.request_data(opt,null,process_hotel_list,c);
}

//process response
var hotels={};
function process_hotel_list(data,args){

	if(!data || data.IsError)
		return;
	//get hotel list data
	for(var i=0;i<data.Items.length;i++){
		var item = data.Items[i];
		var h = new entity.hotel();
		h.id = item.HotelId;
		h.name = item.HotelName;
		h.city = data.CityName;
		h.star = item.StarCode;
		h.prate = item.GoodCommentPercent;
		h.zoneName = item.BusinessAreaName;
		h.commentCount = item.CommentCount;
		helper.request_data(
		new helper.basic_options('m.elong.com','/hotel/'+args.pinyin+'/'+h.id+'/','GET',true,false,{'checkindate':checkindate,'checkoutdate':checkoutdate}),
		null,
		process_one_hotel,
		[h,args]
		);
	}
	//get next page.
	var c = args;
	if(!c.pageCount) c.pageCount = data.PageCount;
	if(!c.curPageIdx) c.curPageIdx = 0;
	if(!c.hotelCount) c.hotelCount=data.HotelCount;
	if(c.curHotelIdx==undefined) c.curHotelIdx=0;
	while(c.curPageIdx<c.pageCount-1){
		c.curPageIdx++;
		var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,c.curPageIdx);
		var query = {'getHotelListReq':req};
		var opt = new helper.basic_options('m.elong.com','/hotel/HotelListData','GET',true,false,query);
		helper.request_data(opt,null,process_hotel_list,c);
	}
}

function process_one_hotel(data,args){
	console.log(args[1].cname+": "+(args[1].curPageIdx+1)+"/"+args[1].pageCount+", "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
	var doc = $(data);
	var rooms = doc.find("ul.roomlist > li");
	if(rooms.length==0)
		return;
	// var commNode = doc.find('table.infotab tbody tr:first-child td section:last-child span:last-child');
	// if(commNode.length>0)
	// 	args.commentCount = Number(commNode[0].innerHTML.trim().match(/\d+/)[0]);
	var picNode = doc.find('table.infotab tr:first-child td div');
	if(picNode.length>0)
		args[0].picCount = Number(picNode[0].innerHTML.trim().match(/\d+/)[0]);
	
	rooms.each(function(idx,room){
		var r = new entity.room();
		var namenode = room.getElementsByTagName('b');
		if(namenode.length>0){
			r.name = namenode[0].innerHTML.trim();
			var ele = room.children&&room.children[2];
			if(ele&&ele.tagName=='SPAN'&&ele.getAttribute('class')=='spanPrepay_icon')
				r.payType = 0;
			var floatflag = room.children&&room.children[0];
			if(floatflag&&floatflag.tagName=='SPAN'){
				var cl = floatflag.getAttribute('class');
				if(cl=='floatflag sjzxflag'){
					r.sjzx = 'Y';
				}
				else if(cl=='floatflag xsqgflag')
					r.xsqg='Y';
				else if(cl=='floatflag jrtjflag')
					r.jrtj='Y';
			}
		}
		var $room = $(room);
		var infos = $room.find('table tr:first-child td span');
		if(infos.length==2){
			var breakfast = infos[0].innerHTML.trim();
			r.breakfast = breakfast;
			
			var lan = infos[1].innerHTML.trim();
			if(lan=='宽带')
				r.lan = 'Y';
			else r.lan='N';
		}
		var priceNodes = $room.find('.orange');
		if(priceNodes.length>=1)
			r.price = priceNodes[0].children[0].innerHTML.trim();
		if(priceNodes.length>1)
			r.fan = priceNodes[1].childNodes.length==3&&priceNodes[1].childNodes[2].value;
		args[0].rooms.push(r);
	});
	appendToFile("app_elong_hotel.txt",args[0].toString("elong"));
}


//write file
function appendToFile(file,data){
	fs.appendFile(file,data,function(err){
		if(err)
			console.log(err.message);
	});
}
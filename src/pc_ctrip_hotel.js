var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')
var entity = require('../models/entity.js')
var sprintf = require("sprintf-js").sprintf

//basic settings.
var checkindate = "2014-05-01";
var checkoutdate = "2014-05-02";
var arguments = process.argv.splice(2);
var level = arguments[0]||'';
useproxy = arguments[1]!=undefined;
var resultFile = "../result/pc_ctrip_hotel-"+level+".txt";
var countOfHotelsPerCity=6;
var doneFile = "../result/pc_ctrip_done_hotel.txt";
var proxyFile = "../proxy/verified-03-02.txt";
var failedFile = "../result/pc_ctrip_failed_hotel.txt";
var cityFile = "../appdata/qunar_hot_city.txt";
var doneHotelsCn=[];
var todoHotels=[];

if(fs.existsSync(doneFile)){
	doneHotelsCn = fs.readFileSync(doneFile).toString().split('\r\n');	
}

var doneHotelsDic = {};
for(var x = 0;x<doneHotelsCn.length;x++){
	doneHotelsDic[doneHotelsCn[x]]=true;
}
var pageSize=30;
if(useproxy){
  var proxy = new helper.proxy();
  proxy.load(proxyFile);
  requestCount=0;
}
function getProxy(){
  requestCount++;
  if(requestCount==1){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}
//get cities
var cities = helper.get_cities(cityFile);
console.log('program start.');
var cs = {};
//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
for(var i=0;i<cities.length;i++){
	var c = cities[i];
	cs[c.cname]=c;

	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
	//var query = {'getHotelListReq':req};
}
function start(){
	var lines = fs.readFileSync("../appdata/elonghotels.txt").toString().split('\r\n');
	for(var i=0;i<lines.length;i++){
	    if(!lines[i]) continue;
		var l = lines[i];
		var kvs = l.split(',');
		var cityName = kvs[0];
	    var elongId = kvs[1];
		var hotelName = kvs[2];
	    var elongStar = kvs[3];
		if(doneHotelsDic[l]) continue;
	    todoHotels.push({'cityName':cityName,'hotelName':hotelName,elongId:elongId,elongStar:elongStar});
	}
    console.log(todoHotels.length + " hotels.");
		gonext();
	
	
	//query["hsr.PageIndex"]=1;
	//query["hsr.StarLevels"]=level;
	//query["hsr.PageSize"]=pageSize;
	// var path = "/hotel/"+c.pinyin+c.id;
	// path += "k1"+
	// if(level){
	// 	path += "/star"+level+"p1";
	// }else{
	// 	path+="/p1";
	// }
	// var opt = null;
	// if(useproxy){
	// 	var p = getProxy();
	// 	opt = new helper.basic_options(p.host,"http://hotels.ctrip.com"+path,"POST",false,false,query,p.port);
	// }else{
	// 	opt = new helper.basic_options('hotels.ctrip.com',path,'POST',false,false,query);
	// }
	
	// opt.headers["referer"] = "http://hotels.ctrip.com/";
	// console.log("starting "+c.cname);
	// helper.request_data(opt,query,process_hotel_list,c);
}
	
function gonext(){
    if(todoHotels.length==0) return;
    var cur = todoHotels.pop();
    var c = cs[cur.cityName];
    var query = {};
    query["StartDate"]= checkindate;
    query["DepDate"]= checkoutdate;
    query["cityId"]= c.id;
    query["star"] = 0;
    var path = "/hotel/"+c.pinyin+c.id+"/k1"+encodeURI(cur.hotelName);
    var opt = null;
    if(useproxy){
	var p = getProxy();
	opt = new helper.basic_options(p.host,"http://hotels.ctrip.com"+path,"POST",false,false,query,p.port);
    }else{
	opt = new helper.basic_options('hotels.ctrip.com',path,'POST',false,false,query);
    }
    
    opt.headers["referer"] = "http://hotels.ctrip.com/";
    console.log("starting "+cur.hotelName);
    helper.request_data(opt,query,process_hotel_list,[c,cur]);
}


//process response
var hotels={};
function process_hotel_list(data,args){
    if(!data)
	return;
//    var $data = null;
    var $=cheerio.load(data);
    try{
//	$data = $(data);
    }catch(e){
	console.log(e.message);
	return;
    }
    var c = args[0];
    if(!c.pageCount) {
	var pageCount = $("div.c_page_list a:last-child").text();
	if(pageCount){
	    try{
		pageCount = Number(pageCount);	
		c.pageCount = pageCount;
	    }catch(e){
		console.log(e.message);
		return;
	    }
	    
	}else{
	    return;
	}
    }
    if(!c.curPageIdx) {
	c.curPageIdx = 1;
    }
    if(!c.hotelCount) {
	var total = $("#B1").text();
	if(total){
	    try{
		total = Number(total);
		c.hotelCount=total;
	    }catch(e){
		console.log(e.message);
		return;
	    }
	}else{
	    return;
	}
    }
    if(c.curHotelIdx==undefined) c.curHotelIdx=0;
    var cnf = data.match(/allRoom.+/);
    if(cnf&&cnf.length>0)
	cnf = cnf[0];
    else{
	fs.appendFileSync(failedFile,args[1].cityName+","+args[1].hotelName+'\r\n');
	return;
    }
    var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
    //"addressUrlConfig"
    

    //get hotel list data
    //if(args[1].idxOfPage!=undefined){
    //console.log("processing "+c.cname+" : "+(c.curHotelIdx+1)+"/"+c.hotelCount);
    var hotelList = $("#hotel_list div.searchresult_list");
    //hotelList.each(function(i,item){
    if(hotelList.length==0) return;
    var item = $("#hotel_list div.searchresult_list").eq(0);
    //var item = hotelList[args[1].idxOfPage];

    
    var cssLinkResult = '';/*
    $("link[rel|=stylesheet]").each(function(){
	var href = $(this).attr("href");
	if(!href || href.search(/h57/i)==-1)
	    return;
	else{
	    cssLinkResult = href;
	}
    });*/

    var h = new entity.hotel();
    h.name = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name a",item).attr("title");
    h.id = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name",item).attr("data-id");
    h.city = args[0].cname;
    h.star = $("ul.searchresult_info li.searchresult_info_name p.medal_list span",item).attr("title");
    h.points = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_value",item).text();
    h.commentCount = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_judgement",item).text();
    h.commentCount = h.commentCount && h.commentCount.match(/\d+/)[0];
    url="http://hotels.ctrip.com"+url+'hotel='+h.id+'&startDate=2014-05-01&depDate=2014-05-02&OrderBy=ctrip&OrderType=ASC&index=1&page=1&rs=1';
    helper.request_data(url,null,process_one,[h,c,args[1]]);
    // $(item).find("div.room_list2 table.hotel_datelist tr").each(function(i,r){
    // 	var room = new entity.room();
    // 	var tds = $(r).find("td");
    // 	if(tds.length==0) return;
    // 	room.name = $(tds[0]).find("a.hotel_room_name").text();
    // 	room.bedType = $(tds[1]).find("span").text();
    // 	room.breakfast = $(tds[2]).find("span").text();
    // 	room.lan = tds[3].children[0].innerHTML;
    // 	room.price = '';
    // 	$(tds[5]).find("span var").each(function(i,v){
    // 		var p = v.getAttribute("class");
    // 		p = p.replace("p_h57_",'');
    // 		room.price += p;
    // 	});
    // 	room.fan = $(tds[6]).find("span").text();
    // 	h.rooms.push(room);
    // });
    // fs.appendFile(resultFile,h.toString("ctrip_pc"),function(e){
    // 	if(e)
    // 		console.log(e.message);
    // 	else{
    // 		c.curHotelIdx++;
    // 		console.log("done "+args[0].cname+" : "+c.curHotelIdx);
    // 		fs.writeFileSync("htmlfiles/"+h.id+".html",cssLinkResult);
    // 	}
    // });
    //});
    //h.prate = item.CommentGoodRate;
    //h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
    //h.commentCount = item.TotalComment;
    // var opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,{'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id});
    // opt.headers["referer"] = "http://hotel.elong.com/";
    // request_data(
    // opt,
    // null,
    // process_one_hotel,
    // [h,args[0]]
    // );
    //}
    //else{
    
    // 	//get next page.
    // var hotelToGet = helper.getrandoms(c.hotelCount,countOfHotelsPerCity,pageSize);
    // for(var x in hotelToGet){
    // 	// var query = {};
    // 	// query["hsr.CheckInDate"]= checkindate;
    // 	// query["hsr.CheckOutDate"]= checkoutdate;
    // 	// query["hsr.CityId"]= c.id;
    // 	// query["hsr.PageIndex"]=hotelToGet[x].pageIdx;
    // 	// query["hsr.StarLevels"]=level;
    // 	// query["idxOfPage"] = hotelToGet[x].idxOfPage;
    // 	var query = {"StartDate":checkindate,"DepDate":checkoutdate,"cityId":c.id,"idxOfPage":hotelToGet[x].idxOfPage};
    // 	var opt = null;
    // 	var path = "/hotel/"+c.pinyin+c.id;
    // 	if(level){
    // 		path += "star"+level+"p"+hotelToGet[x].pageIdx;
    // 	}else{
    // 		path += "p"+hotelToGet[x].pageIdx;
    // 	}
    // 	if(useproxy){
    // 		var p = getProxy();
    // 		opt = new helper.basic_options(p.host,'http://hotels.ctrip.com'+path,'GET',false,false,query,p.port);
    // 	}else{
    // 		opt = new helper.basic_options('hotels.ctrip.com',path,'POST',false,false,query,null);
    // 	}
    
    // 	opt.headers["referer"] = "http://hotels.ctrip.com/";
    // 	helper.request_data(opt,query,process_hotel_list,c);
    // }
    //console.log("done processing page: "+args[1]["hsr.PageIndex"]);
    //}
    
    // for(var i=0;i<data.value.ListStaticInfos.length;i++){
    // 	var item = data.value.ListStaticInfos[i];
    // 	var h = new entity.hotel();
    // 	h.id = item.HotelId+'';
    // 	h.name = item.HotelNameCn;
    // 	h.city = args[0].cname;
    // 	h.star = item.Star;
    // 	h.prate = item.CommentGoodRate;
    // 	h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
    // 	h.commentCount = item.TotalComment;
    // 	h.goodComment = 0;
    // 	h.badComment = 0;
    // 	var opt = null;
    // 	var query = {'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id};
    // 	if(useproxy){
    // 		var p = getProxy();
    // 		opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomset","GET",false,true,query,p.port);
    // 	}else{
    // 		opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,query);
    // 	}
    
    // 	opt.headers["referer"] = "http://hotel.elong.com/";
    // 	helper.request_data(opt,null,process_one_hotel,[h,args[0]]);
    // }
    // //console.log("done "+args[0].cname+": "+args[1]["hsr.PageIndex"]+"/"+c.pageCount);
    // while(c.curPageIdx<c.pageCount){
    // 	c.curPageIdx++;
    // 	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,c.curPageIdx);
    // 	//var query = {'getHotelListReq':req};
    // 	var query = {};
    // 	query["hsr.CheckInDate"]= checkindate;
    // 	query["hsr.CheckOutDate"]= checkoutdate;
    // 	query["hsr.CityId"]= args[0].id;
    // 	query["hsr.PageIndex"]=c.curPageIdx;
    // 	var opt = null;
    // 	if(useproxy){
    // 		var p = getProxy();
    // 		opt = new helper.basic_options(p.host,'http://hotel.elong.com/isajax/List/Search',"GET",false,true,query,p.port);
    // 	}else{
    // 		opt = new helper.basic_options('hotel.elong.com','/isajax/List/Search','GET',false,true,query);
    // 	}
    
    // 	opt.headers["referer"] = "http://hotel.elong.com/";
    // 	helper.request_data(opt,null,process_hotel_list,c);
    // }
}
//http://hotels.ctrip.com/Domestic/tool/AjaxHotelPriceNew.aspx?distinct=-1&&type=new&psid=h5|556,h41|562,h4|573,h34|570,h57|567&hotel=63689&&price=0-&RequestTravelMoney=F&promotion=F&prepay=F&IsCanReserve=F&IsJustConfirm=F&equip=&OrderBy=ctrip&OrderType=ASC&startDate=2014-04-01&depDate=2014-04-02&OrderBy=ctrip&OrderType=ASC&index=1&page=1&rs=1
function process_one(data,args){
    if(!data) {
	console.log("no data.");
	return;
    }
    var $ = cheerio.load(data);
    var h = args[0];
    var c = args[1];
    $("tr.t").each(function(){
	if($('td',this).length==1){
	    var prefix = $('td a.hotel_room_name',this).text();
	    var nextRow = $(this).next();
	    while(nextRow.attr('class')=='unexpanded'){
		var room = new entity.room();
		room.name = prefix + $("td.hotel_room div.child_room_box span.hotel_room_style",nextRow).text();
		room.name=room.name && room.name.replace(/[,]/g,';');
		var tds = $('td',nextRow);
		room.bedType = $('span',tds.eq(1)).text();
		room.breakfast = $(tds.eq(2)).text();
		room.lan = $(tds.eq(3)).text();
		room.price = $(tds.eq(5)).text();
		room.fan = $('span',tds.eq(6)).text();
		h.rooms.push(room);
		nextRow = nextRow.next();
	    }
	}else{
	    var room = new entity.room();
	    var tds = $("td",this);
	    if(tds.length==0) return;
	    room.name = $("a.hotel_room_name",tds.eq(0)).text();
	    room.name=room.name && room.name.replace(/[,]/g,';');
	    room.bedType = $("span",tds.eq(1)).text();
	    room.breakfast = $("span",tds.eq(2)).text();
	    room.lan = tds.eq(3)&&$('span:first-child',tds.eq(3)).text().trim();
	    room.price = $(tds.eq(5)).text();
	    // $(tds[5]).find("span var").each(function(i,v){
	    // 	var p = v.getAttribute("class");
	    // 	p = p.replace("p_h57_",'');
	    // 	room.price += p;
	    // });
	    room.fan = $("span",tds.eq(6)).text();
	    h.rooms.push(room);
	    tds=null;
	}
    });
    fs.appendFileSync(doneFile,c.cname+","+args[2].elongId+','+args[2].hotelName+','+args[2].elongStar+','+h.id+','+h.name+','+h.star+"\r\n");
    fs.appendFile(resultFile,h.toString("ctrip_pc"),function(e){
	if(e)
	    console.log(e.message);
	else{
	    c.curHotelIdx++;
	    console.log("done "+c.cname+" : "+c.curHotelIdx);
	    //fs.writeFileSync("htmlfiles/"+h.id+".html",args[2]);
	    $=null;
	    data=null;
	    setTimeout(function(){
		gonext();
	    },(Math.random()*9+2)*1000);
	}
    });
}


start();
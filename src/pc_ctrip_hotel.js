var fs = require('fs')
var cheerio = require('cheerio')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

//get cities
var cities = helper.get_cities("../appdata/qunar_hot_city.txt");
console.log('program start.');
var cs = {};
//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
for(var i=0;i<cities.length;i++){
	var c = cities[i];
	cs[c.cname]=c;

	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
	//var query = {'getHotelListReq':req};
}

function CtripHotel(){
    this.checkindate = "2014-07-01";
    this.checkoutdate = "2014-07-02";
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "pc_ctrip_hotel-.txt";
    this.countOfHotelsPerCity=6;
    this.doneFile = "pc_ctrip_done_hotel.txt";
    this.proxyFile = "verified-03-02.txt";
    this.failedFile = "pc_ctrip_failed_hotel.txt";
    this.cityFile = "qunar_hot_city.txt";
    this.doneHotel = {count:0};
    this.doneHotelsDic={};
    this.todoHotels=[];
}

CtripHotel.prototype.init = function(){
    if(fs.existsSync(this.resultDir + this.doneFile)){
	this.doneHotelsCn = fs.readFileSync(this.resultDir+this.doneFile).toString().split('\n').reduce(function(pre,l){
	    if(!l) return;
	    var name = l.replace('\r','').split(',')[2];
	    pre[name]=true;
	    pre.count++;
	    return pre;
	},this.doneHotel);
    }
    this.todoHotels = fs.readFileSync(this.dataDir+"elonghotels.txt")
	.toString()
	.split('\n')
	.filter(function(l){
	    if(!l || l=='\r')
		return false;
	    var kvs = l.split(',');
	    var cityName = kvs[0];
	    var elongId = kvs[1];
	    var hotelName = kvs[2];
	    var elongStar = kvs[3].replace('\r',"").replace('\n',"");
	    return !this.doneHotel[hotelName];
	},this)
	.map(function(l){
	    var kvs = l.split(',');
	    var cityName = kvs[0];
	    var elongId = kvs[1];
	    var hotelName = kvs[2];
	    var elongStar = kvs[3].replace('\r',"").replace('\n',"");
	    return {cityName:cityName,hotelName:hotelName,elongId:elongId,elongStar:elongStar};
	},this);
    console.log("%d hotels to do",this.todoHotels.length);
}

CtripHotel.prototype.start = function(){
    this.init();
    this.search();
}

CtripHotel.prototype.wgetList = function(){
    
}

CtripHotel.prototype.search = function(){
    if(this.todoHotels.length==0)
	return;
    
    var cur = this.todoHotels.shift();
    var c = cs[cur.cityName];
    var query = {
	StartDate : this.checkindate,
	DepDate : this.checkoutdate,
	cityId : c.id,
	star : 0
    };
    if(c.id==1024){
	c.pinyin = "ma'anshan";
    }
    var path = "/hotel/"+c.pinyin+c.id+"/k1"+encodeURI(cur.hotelName);
    var opt = new helper.basic_options('hotels.ctrip.com',path,'POST',false,false,query);
    
    opt.headers["referer"] = "http://hotels.ctrip.com/";
    console.log("GET %s",cur.hotelName);
    helper.request_data(opt,query,function(data,args){
	that.filterFromResult(data,args);
    },[c,cur]);
}

CtripHotel.prototype.filterFromResult = function(data,args){
    if(!data){
	this.search();
	return;
    }
    var $=cheerio.load(data);
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
	    this.search();
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
	    //this.search();
	    //return;
	}
    }
    if(c.curHotelIdx==undefined) c.curHotelIdx=0;
    var cnf = data.match(/allRoom.+/);
    if(cnf&&cnf.length>0)
	cnf = cnf[0];
    else{
//	fs.appendFileSync(failedFile,args[1].cityName+","+args[1].hotelName+'\r\n');
	this.search();
	return;
    }
    var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
    var hotelList = $("#hotel_list div.searchresult_list");

    if(hotelList.length==0){
	setTimeout(function(){
	    that.search();
	},100);
	return;
    }
    var item = $("#hotel_list div.searchresult_list").eq(0);
    var h = new entity.hotel();
    h.name = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name a",item).attr("title");
    h.id = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name",item).attr("data-id");
    h.city = args[0].cname;
    h.star = $("ul.searchresult_info li.searchresult_info_name p.medal_list span",item).attr("title");
    h.points = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_value",item).text();
    h.commentCount = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_judgement",item).text();
    h.commentCount = h.commentCount && h.commentCount.match(/\d+/)[0];
    url="http://hotels.ctrip.com"+url+'hotel='+h.id+'&startDate=2014-06-01&depDate=2014-06-02&OrderBy=ctrip&OrderType=ASC&index=1&page=1&rs=1';
    helper.request_data(url,null,function(data,args){
	that.processDetail(data,args);
    },[h,c,args[1]]);
}

CtripHotel.prototype.wgetDetail = function(){
    
}

CtripHotel.prototype.processList = function(){
    
}

CtripHotel.prototype.processDetail = function(data,args){
    if(!data) {
	console.log("no data.");
	this.search();
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
		room.name=room.name && room.name.replace(/[,，]/g,';');
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
	    room.fan = $("span",tds.eq(6)).text();
	    h.rooms.push(room);
	    tds=null;
	}
    });
    fs.appendFileSync(this.resultDir+this.doneFile,c.cname+","+args[2].elongId+','+args[2].hotelName+','+args[2].elongStar+','+h.id+','+h.name+','+h.star+"\r\n");
    fs.appendFile(this.resultDir + this.resultFile,h.toString("ctrip_pc"),function(e){
	if(e)
	    console.log(e.message);
	else{
	    c.curHotelIdx++;
	    console.log("done "+c.cname+" : "+c.curHotelIdx);
	    $=null;
	    data=null;
	    setTimeout(function(){
		that.search();
	    },(Math.random()*9+2)*1000);
	}
    });
}

var instance = new CtripHotel();
var that = instance;
instance.start();

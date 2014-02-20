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
var app_qunar_done_city_file = "app_qunar_done_city_hotel.txt";
var app_qunar_done_hotel= "app_qunar_done_hotel.txt";

//prepare data
var cities = helper.get_cities('fc.txt');
var proxys = helper.get_proxy('avaliable_proxy4.txt');
var doneCities = {};
var doneHotels = {};

function syncDoneCities(){
  if(!fs.existsSync(app_qunar_done_city_file)) return;
  var lines = fs.readFileSync(app_qunar_done_city_file).toString().split('\r\n');
  for(var i=0;i<lines.length;i++){
    doneCities[lines[i]] = true;
  }
}
function syncDoneHotels(){
	if(!fs.existsSync(app_qunar_done_hotel)) return;
var lines = fs.readFileSync(app_qunar_done_hotel).toString().split('\r\n');
for(var i=0;i<lines.length;i++){
	doneHotels[lines[i]] = true;
}
}
//get proxy random ip
function randomip(proxys){
  var idx = Math.random()*(proxys.length);
  idx = parseInt(idx);
  return proxys[idx];
}
function start(){
	syncDoneCities();
	//request data   http://h.qunar.com/list.jsp?checkin=20140223&days=1&city=北京&pageNum=1
	for(var i=0;i<cities.length;i++){
		var c = cities[i];
		if(doneCities[c.cname]) continue;
		var proxy = randomip(proxys);
		var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":1};
		var opt = new helper.basic_options(proxy.host,'http://h.qunar.com/list.jsp','GET',true,false,query,proxy.port);
		helper.request_data(opt,null,process_hotel_list,c);
	}	
}
start();

//process response

function process_hotel_list(data,args){
	//get hotel list data
	if(!data || data.IsError)
		return;
	var doc = $(data);
	var items = doc.find('table.fl tr td:first-child');
	if(items.length==0) return;
	items.each(function(idx,td){
		var h = new entity.hotel();
		h.city = args.cname;
		var a = td.childNodes[1];
		if(a){
			h.name = a.innerHTML&&a.innerHTML.trim();
			var href = a.getAttribute('href');
			var matches = href&&href.match(/seq=\w+/);
			h.id = matches&&matches[0].split('=')[1];;
		}
		if(doneHotels[h.id]) {
			if(args.curHotelIdx==undefined)
				args.curHotelIdx=1;
			else
				args.curHotelIdx++;
			return;
		}
		var pointsAndZone = td.childNodes[4].value&&td.childNodes[4].value.trim();
		if(pointsAndZone){
			var matches = pointsAndZone.match(/\d*\.\d*/);
			h.points = matches&&matches[0];
			h.zoneName = pointsAndZone.split(' ')[1];	
		}
		var proxy = randomip(proxys);
		helper.request_data(
		new helper.basic_options(proxy.host,'http://h.qunar.com/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args.cname},proxy.port),
		null,
		process_one_hotel,
		[h,args]
		);
	});
	
	
	//get next page.
	var matches = data.match(/\d+\/\d+/g);
	var pageCount = matches&&matches[0].split('/')[1];
	var p = doc.find("div.ct p:first-child");
	var hotelCount = 0;
	if(p.length>0){
		var matches=p[0].childNodes && p[0].childNodes[2].value&&p[0].childNodes[2].value.trim().match(/\d+/);
		hotelCount=matches&&matches[0];
	}
	var c = args;
	if(!c.pageCount) c.pageCount = pageCount;
	if(!c.curPageIdx) c.curPageIdx = 1;
	if(!c.hotelCount&&hotelCount>0) c.hotelCount=hotelCount;
	if(c.curHotelIdx==undefined) c.curHotelIdx=0;
	console.log(c.cname+":"+c.curPageIdx+"/"+c.pageCount);
	while(c.curPageIdx<c.pageCount-1){
		c.curPageIdx++;
		var proxy = randomip(proxys);
		var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":c.curPageIdx};
		var opt = new helper.basic_options(proxy.host,'http://h.qunar.com/list.jsp','GET',true,false,query,proxy.port);
		helper.request_data(opt,null,process_hotel_list,c);
	}
}

function process_one_hotel(data,args){
	console.log(args[1].cname+": "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
	var doc = $(data);
	var starNode = doc.find("div.ct1 table tbody tr td:last-child");
	if(starNode.length>0){
		args[0].star = starNode[0].childNodes[2].value&&starNode[0].childNodes[2].value.trim();
	}

	var comm = data.match(/\d+条评论/);
	if(comm&&comm[0]){
		var matches = comm[0].match(/\d+/);
		args[0].commentCount = matches&&matches[0];
	}
		

	var roomNodes = doc.find("div.room");
	if(roomNodes.length==0) return;

	for(var i=1;i<roomNodes.length;i++){
		var r = new entity.room();
		r.sites=[];
		r.name = roomNodes[i].children&&roomNodes[i].children[0].innerHTML&&roomNodes[i].children[0].innerHTML.trim().replace('房型：','');
		var paraNodes = roomNodes[i].getElementsByTagName('p');
		if(paraNodes.length>0){
			for(var j=0;j<paraNodes.length;j++){
				var site = paraNodes[j].childNodes&&paraNodes[j].childNodes[0]&&paraNodes[j].childNodes[0].value&&paraNodes[j].childNodes[0].value.trim();
				var tuan='N';
				if(site && site.indexOf("团购")!=-1)
					tuan = 'Y';

				var price = paraNodes[j].childNodes[5]&&paraNodes[j].childNodes[5].innerHTML&&paraNodes[j].childNodes[5].innerHTML.trim().replace(/\s/g,'');
				if(site&&price)
					r.sites.push({"site":site,"price":price,"tuan":tuan});
			}
		}
		args[0].rooms.push(r);
	}
	if(args[1].curHotelIdx==args[1].hotelCount){
		doneCities[args[1].cname] = true;
		fs.appendFile(app_qunar_done_city_hotel,args[1].cname+'\r\n',function(err){
			if(err) console.log(err.message);
		});
	}

	appendToFile("app_qunar_hotel.txt",args[0].toString("qunar"));
	fs.appendFile(app_qunar_done_hotel,args[0].id+'\r\n',function(err){
		if(err) console.log(err.message);
	});
}


//write file
function appendToFile(file,data){
	fs.appendFile(file,data,function(err){
		if(err)
			console.log(err.message);
	});
}
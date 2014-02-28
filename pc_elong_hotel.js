var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')
var sprintf = require("sprintf-js").sprintf

//basic settings.
var checkindate = "2014/03/01";
var checkoutdate = "2014/03/02";
var arguments = process.argv.splice(2);
var level = arguments[0]||'';
var resultFile = "pc_elong_hotel-"+level+".txt";
var countOfHotelsPerCity=10;
var pageSize=10;
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
	var opt = new helper.basic_options('hotel.elong.com',"/isajax/List/Search",'GET',false,true,query);
	opt.headers["referer"] = "http://hotel.elong.com/";
	//console.log("starting get "+c.cname+" page:"+pageIdx);
	request_data(opt,null,process_hotel_list,c);
}

//process response
var hotels={};
function process_hotel_list(data,args){

	if(!data||!data.success)
		return;
	//get hotel list data
	if(args[1].idxOfPage!=undefined){
		var item = data.value.ListStaticInfos[args[1].idxOfPage];
		var h = new entity.hotel();
		h.id = item.HotelId+'';
		h.name = item.HotelNameCn;
		h.city = args[0].cname;
		h.star = item.Star;
		h.prate = item.CommentGoodRate;
		h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
		h.commentCount = item.TotalComment;
		var opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,{'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id});
		opt.headers["referer"] = "http://hotel.elong.com/";
		request_data(
		opt,
		null,
		process_one_hotel,
		[h,args[0]]
		);
	}else{
		
		//get next page.
		var c = args[0];
		if(!c.pageCount) c.pageCount = data.value.PageInfo.PageCount;
		if(!c.curPageIdx) c.curPageIdx = data.value.PageInfo.PageIndex;
		if(!c.hotelCount) c.hotelCount=data.value.PageInfo.TotalRow;
		if(c.curHotelIdx==undefined) c.curHotelIdx=0;
		var hotelToGet = helper.getrandoms(c.hotelCount,countOfHotelsPerCity,pageSize);
		for(var x in hotelToGet){
			// var query = {};
			// query["hsr.CheckInDate"]= checkindate;
			// query["hsr.CheckOutDate"]= checkoutdate;
			// query["hsr.CityId"]= c.id;
			// query["hsr.PageIndex"]=hotelToGet[x].pageIdx;
			// query["hsr.StarLevels"]=level;
			// query["idxOfPage"] = hotelToGet[x].idxOfPage;
			var query = {"hsr.CheckInDate":checkindate,"hsr.CheckOutDate":checkoutdate,"hsr.CityId":c.id,"hsr.PageIndex":hotelToGet[x].pageIdx,"idxOfPage":hotelToGet[x].idxOfPage,"hsr.StarLevels":level,"hsr.PageSize":pageSize};
			//var p = getProxy();
			//var opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
			var opt = new helper.basic_options('hotel.elong.com',"/isajax/List/Search",'GET',false,true,query,null);
			opt.headers["referer"] = "http://hotel.elong.com/";
			request_data(opt,null,process_hotel_list,c);
		}
		console.log("done processing page: "+args[1]["hsr.PageIndex"]);
	}
	
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
	// 	var opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,{'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id});
	// 	opt.headers["referer"] = "http://hotel.elong.com/";
	// 	request_data(
	// 	opt,
	// 	null,
	// 	process_one_hotel,
	// 	[h,args[0]]
	// 	);
	// }
	
	// while(c.curPageIdx<c.pageCount){
	// 	c.curPageIdx++;
	// 	//var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,c.curPageIdx);
	// 	//var query = {'getHotelListReq':req};
	// 	var query = {};
	// 	query["hsr.CheckInDate"]= checkindate;
	// 	query["hsr.CheckOutDate"]= checkoutdate;
	// 	query["hsr.CityId"]= args[0].id;
	// 	query["hsr.PageIndex"]=c.curPageIdx;
	// 	var opt = new helper.basic_options('hotel.elong.com','/isajax/List/Search','GET',false,true,query);
	// 	opt.headers["referer"] = "http://hotel.elong.com/";
	// 	request_data(opt,null,process_hotel_list,c);
	// }
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
console.log(args[1].cname+": "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
	var query = {};
		query["hotelId"]= args[0].id;
		query["pageIndex"]= 1;
		query["pageSize"]= 10;
		query["recommentType"]=2;
		var opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelReviews','GET',false,true,query);
		opt.headers["referer"] = "http://hotel.elong.com/";
	request_data(opt,null,process_one_hotel_info,[args[0],args[1]]);
}
function process_one_hotel_info(data,args){
	var jdata = JSON.parse(data);
	args[0].goodComment = jdata.GoodComment;
	args[0].badComment = jdata.BadComment;
	console.log('writting file : '+args[0].id);
	appendToFile(resultFile,args[0].toString("elong_pc"));
}

//write file
function appendToFile(file,data){
	fs.appendFile(file,data,function(err){
		if(err)
			console.log(err.message);
	});
}

function request_data(opts,data,fn,args){
    if(!opts || !fn) throw "argument null 'opt' or 'data'";
    var strData = data && JSON.stringify(data);
    if(opts.method=='POST')
        opts.headers['Content-Length']=Buffer.byteLength(strData);
    
    var req = http.request(opts, function(res) {

    var chunks=[];
    res.on('data', function (chunk) {
            chunks.push(chunk);
    });
    res.on('end',function(){
            if(res.headers['content-encoding']=='gzip'){
        var buffer = Buffer.concat(chunks);
		if(buffer.length==157){
			console.log("current ip has been forbidden.");
		}
        zlib.gunzip(buffer,function(err,decoded){
            if(decoded){
            try{
                var obj = decoded.toString();
                if(res.headers['content-type'].indexOf('application/json')!=-1)
                    obj =JSON.parse(decoded.toString());
				if(Array.isArray(args)){
					args.push(opts.data);
					fn(obj,args);
				}else{
					fn(obj,[args,opts.data]);
				}
                
            }
            catch(e){
                console.log(e.message);
                
            }
            }
        });
            }
            else if(res.headers['content-encoding']=='deflate'){
      var buffer = Buffer.concat(chunks);
      zlib.inflate(buffer,function(err,decoded){
        console.log(decoded&&decoded.toString());
      });
    }
    });
    });
    req.on('error', function(e) {
	if(opts.path && opts.path.indexOf('Search')!=-1){
		console.log("page :"+opts.data["hsr.PageIndex"]+"got error-"+e.message);
		fs.appendFile("pc_elong_hotel_failed.txt","p:"+ JSON.stringify(opts.data)+'\r\n');
	}else{
		console.log("page of hotel:"+opts.data["hsr.CityId"]+" got error-"+e.message);
		fs.appendFile("pc_elong_hotel_failed.txt","h:"+JSON.stringify(opts.data)+'\r\n');
	}
    //console.log(e.message);
	//var proxy = exports.randomip(proxys);
    //            if(proxy.host&&proxy.port){
    //                opts.port = proxy.port;
    //                opts.host = proxy.host;    
    //            }
                
                //retry
    //            exports.request_data(opts,data,fn,args);
    });
    if(opts.method=='POST')
        req.write(strData);
    req.end();
}
var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var entity = require('../models/entity.js')
var helper = require('../helpers/webhelper.js')

var hotel_list_options = new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelList',"POST",true,true);
var hotel_detail_options= new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelDetail',"POST",true,true);
var checkindate = "2014-05-01";
var checkoutdate = "2014-05-02";
var doneFile = "../result/app_ctrip_done_hotels.txt";
var resultFile = "../result/app_ctrip_hotel.txt";
var cityFile = "../appdata/qunar_hot_city.txt";

var hotelListData = {
    "CheckInCityID":"1",
    "CheckInCity":"北京",
    "isHot":2,
    "OrderName":0,
    "OrderType":1,
    "CheckInDate":checkindate,
    "PageNumber":1,
    "CheckOutDate":checkoutdate,
    "Days":"1",
    "KeyWord":"",
    "DistrictId":-1,
    "ZoneName":"",
    "Zone":"",
    "Location":"",
    "LocationName":"",
    "MetroId":"",
    "MetroName":"",
    "BrandId":"",
    "BrandName":"",
    "IsMorning":"0",
    "isYesterdayOrder":false,
    "Star":""
};
hotelListData.clone=function(){
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

var requestDetailData = function(cityId,hotelId){
    this.CheckInDate= checkindate;
    this.CheckOutDate=checkoutdate;
    this.CityID= cityId;
    this.HotelID= hotelId;
    this.IsMorning= "0";
};
entity.hotel.prototype.appendToFile=function(){
    var id=this.id;
    fs.appendFile(resultFile,this.toString());
    fs.appendFile(doneFile,id+"\r\n");
    doneHotels[id]=true;
    console.log(++doneHotelCount+"/"+hotelCount);
    if(doneHotelCount==hotelCount) console.log("job complete.\r\n");
}

//get cities from file

var cities={};
var doneCities={};
var doneHotels={};
var curCity=0;
var doneCityCount=0;
var cityCount=0;
var doneHotelCount=0;
var hotelCount=0;
fs.readFileSync(cityFile).toString().split("\n").forEach(function(line){
    if(!line) return;
    line = line.replace('\r','');
    var pyh = line.split(' ');
    var id = pyh[0].match(/\d+/);
    var name = pyh[1];
    cities[id]={"name":name,pageCount:1,curPageIdx:1,rd:null,gotPageIdx:0};
    cityCount++;
});
if(fs.existsSync(doneFile)){
    fs.readFileSync(doneFile).toString().split("\r\n").forEach(function(line){
    var id = line&&Number(line);
    if(id)
        doneHotels[id]=true;
});
}

var pageCount=1;
var curPageIdx=1;
var hotels={};
var k=2;
//for(var k in cities){
    var c = cities[k];
    c["rd"] = hotelListData//.clone();
    //c["rd"]["CheckInCityID"]=k;
    //c["rd"]["CheckInCity"]=c.name||"上海";
    c["rd"]["PageNumber"]=1;
//    console.log("GET "+c.name);
//    console.log(c["rd"]);

//    helper.request_data(hotel_list_options,c["rd"],one_page_data,k);
//}

function hotel_page_data(obj){
    var data=null;
    if(obj&&obj.Data){
        data = obj.Data;
    }
    if(data&&data!==''){
        data = helper.CtripUnPack(data);
        if(data&&data[0]){
            var h = hotels[data[0].HotelID];
            
            h.commentCount=data[0].CommentTotal;
            h.custPoints = data[0].CustPoints;
            h.faclPoints= data[0].FaclPoints;
            h.raAtPoints = data[0].RaAtPoints;
            h.ratPoints = data[0].RatPoints;
            h.servPoints = data[0].ServPoints;
            if(data[0].HotelPicList)
                h.picCount = data[0].HotelPicList.length;
            if(data[0].RoomDetailList){
                for(var i in data[0].RoomDetailList){
                    var r = data[0].RoomDetailList[i];
                    var rm = new entity.room();
                    rm.id=r.RoomID;
                    rm.name=r.RoomName;
                    rm.price=r.RoomPrice||r.AvgPrice;
                    rm.breakfast = r.Breakfast;
                    rm.fan = r.FanDesc;
                    rm.gift = r.GiftName;
                    rm.isCu = r.IsCu;
                    rm.payType = r.PayType;
                    h.rooms.push(rm);
                }
                h.appendToFile();
            }
        }
    }
}

function one_page_data(obj,args){
    if (!obj || (obj.ServerCode != 1 && obj.ServerCode != 6)){
	console.log("Error!");
	console.log(obj);
        return;
    }
    var cityId= args[0];
    if(obj.Data){
        var a = obj.Data;
        a = helper.CtripUnPack(a);
        if(a && a.length > 0 && a[0].TotalCount > 0 && a[0].HotelLists && a[0].HotelLists.length > 0){
            cities[cityId].pageCount=a[0].TotalPage;
            for(var i=0;i<a[0].HotelLists.length;i++){
                var h = new entity.hotel();
                var h_obj = a[0].HotelLists[i];
		if(doneHotels[h_obj.HotelID]) continue;
                h.city=cities[cityId]&&cities[cityId].name;
                h.id=h_obj.HotelID;
                h.name=h_obj.HotelName;
                //h.shortName=h_arr[3];
                h.star = h_obj.Star;
                h.currency=h_obj.Currency;
                //h.lowPrice=h_arr[7];
                h.points = h_obj.Points;
                h.zoneName = h_obj.ZoneName;
                //h.isGift = h_arr[10]==1?true:false;
                //h.isNew = h_arr[11]==1?true:false;
                //h.isFan = h_arr[12]==1?true:false;
                //h.fanPrice=h_arr[13];
                //h.isQuan = h_arr[14]==1?true:false;
                //h.quanPrice = h_arr[15];
                //h.quanType = h_arr[16];
                //h.isCu = h_arr[17]==1?true:false;
                //h.isMp=h_arr[18]==1?true:false;
                //h.isMorning=h_arr[19]==1?true:false;
                //h.isStar = h_arr[20]==1?true:false;
                hotels[h.id]=h;
                hotelCount++;
                helper.request_data(hotel_detail_options,new requestDetailData(cityId,h.id),hotel_page_data);
                //get_res_data(new requestDetailData(cityId,h.id),hotel_page_data,"detail");
            }
            console.log("got "+cities[cityId].curPageIdx+++"/"+cities[cityId].pageCount);    
        }
    }
    else console.log("failed "+ cities[cityId].curPageIdx+++"/"+cities[cityId].pageCount);
        
    while(cities[cityId]["rd"]["PageNumber"]<cities[cityId].pageCount){
        //++cities[cityId].curPageIdx;
        cities[cityId]["rd"]["PageNumber"]++;
        //get_res_data(cities[cityId]["rd"],one_page_data);
        helper.request_data(hotel_list_options,cities[cityId]["rd"],one_page_data,cityId);
    }
}

function MCtripHotel(){
    this.checkindate = "2014-05-01";
    this.checkoutdate = "2014-05-02";
    this.resultDir = "../result/";
    this.appDir = "../appdata/";
    this.doneFile = "app_ctrip_done_hotels.txt";
    this.resultFile = "app_ctrip_hotel.txt";
    this.cityFile = "qunar_hot_city.txt";

    this.cities = [];
    this.todoHotels=[];
    this.doneHotels={};

    this.listQuery = function(city,pageNum){
	if(!city || !city.id || !city.cname)
	    return;
	if(pageNum==undefined)
	    pageNum=1;
	
	this.CheckInCityID=city.id;
	this.CheckInCity=city.cname;
	this.isHot=2;
	this.OrderName=0;
	this.OrderType=1;
	this.CheckInDate=that.checkindate;
	this.PageNumber = pageNum;
	this.CheckOutDate=that.checkoutdate;
	this.Days = 1;
	this.DistrictId = -1;
	this.IsMorning=0;
	this.isYesterdayOrder=false;
    };
    this.detailQuery = function(cityId,hotelId){
	this.CheckInDate= that.checkindate;
	this.CheckOutDate=that.checkoutdate;
	this.CityID= cityId;
	this.HotelID= hotelId;
	this.IsMorning= "0";
    };
}

MCtripHotel.prototype.start = function(){
    this.init();
    this.load();
    this.wgetList();
}
MCtripHotel.prototype.init = function(){
    this.cities = helper.get_cities(this.appDir+ this.cityFile);
    this.cityDict= helper.getCitiesDict(this.appDir+this.cityFile);
}

MCtripHotel.prototype.load = function(){
    if(!fs.existsSync(this.resultDir+this.doneFile)){
	return;
    }
    //load done list.
    fs.readFileSync(this.resultDir+this.doneFile).toString().split('\r\n').reduce(function(pre,cur){
	var id = cur.split(',')[0];
	pre[id]=cur;
	return pre;
    },this.doneHotels);
}

MCtripHotel.prototype.wgetList = function(){
    if(this.cur){
	if(this.cur.curPageIdx+this.cur.failedPageCount==this.cur.pageCount){
	    if(this.todoHotels.length==0){
		if(this.cities.length==0){
		    console.log("Done.");
		    return;
		}
		do{
		    this.cur = this.cities.shift();
		}while(this.doneHotels[this.cur.cname]);
	    }else{
		//hotel list done, start detail
		this.wgetDetail();
		return;
	    }
	}
    }
    else{
	if(this.cities.length==0){
	    console.log("Done.");
	    return;
	}
	do{
	    this.cur = this.cities.shift();
	}while(this.doneHotels[this.cur.cname]);
    }
    var query = new this.listQuery(this.cur,this.cur.curPageIdx);
    var opt = new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelList',"POST",true,true,query);
    opt.headers['Content-Type']="application/json";
    setTimeout(function(){
	console.log("GET %d/%d",that.cur.curPageIdx,that.cur.pageCount);
	helper.request_data(opt,query,function(data,args){
	    that.processList(data,args);
	    that.wgetList();
	},that.cur);
    },(Math.random()*9+2)*1000);
    /*
    var query = new this.listQuery(this.cur,this.cur.curPageIdx);
    var opt = new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelList',"POST",true,true,query);
    opt.headers['Content-Type']="application/json";
    helper.request_data(opt,query,function(data,args){
	that.processList(data,args);
    },this.cur);*/
}

MCtripHotel.prototype.wgetDetail = function(){
    if(this.todoHotels.length==0){
	console.log("Done: %s",this.cur.cname);
	fs.appendFileSync(this.resultDir+this.doneFile,this.cur.cname+'\r\n');
	this.wgetList();
	return;
    }
    do{
	var curHotel = this.todoHotels.shift();
    }
    while(this.doneHotels[curHotel.id]);
    
    var query = new this.detailQuery(this.cur.id,curHotel.id);
    var opt = new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelDetail',"POST",true,true,query);
    opt.headers['Content-Type']="application/json";
    setTimeout(function(){
	helper.request_data(opt,query,function(data,args){
	    console.log("GET %s, %s",args[0].cname,args[1].name);
	    that.processDetail(data,args);
	    that.wgetDetail();
	},[that.cur,curHotel]);
    },(Math.random()*9+2)*1000);
}

MCtripHotel.prototype.processList = function(obj,args){
    if(args[0].curPageIdx==undefined)
	args[0].curPageIdx=1;
    if(args[0].failedPageCount==undefined)
	args[0].failedPageCount=0;
    if(args[0].doneCount==undefined)
	args[0].doneCount=0;
    if(args[0].failedCount==undefined)
	args[0].failedCount=0;
    if (!obj || (obj.ServerCode != 1 && obj.ServerCode != 6)){
	console.log("Error!");
	console.log(obj);
	args[0].failedPageCount++;
        return;
    }
    if(obj.Data){
        var a = obj.Data;
        a = helper.CtripUnPack(a);
        if(a && a.length > 0 && a[0].TotalCount > 0 && a[0].HotelLists && a[0].HotelLists.length > 0){
            args[0].pageCount=a[0].TotalPage;
	    args[0].totalCount = a[0].TotalCount;
	    console.log("Process %d/%d",args[0].curPageIdx,args[0].pageCount);
            for(var i=0;i<a[0].HotelLists.length;i++){
                var h = new entity.hotel();
                var h_obj = a[0].HotelLists[i];
		if(this.doneHotels[h_obj.HotelID]) continue;
                h.city=args[0].cname;
                h.id=h_obj.HotelID;
                h.name=h_obj.HotelName;
		h.name = h.name && h.name.trim().replace(/[,，]/g,';');
                h.star = h_obj.Star;
                h.currency=h_obj.Currency;
                h.points = h_obj.Points;
                h.zoneName = h_obj.ZoneName;
                hotels[h.id]=h;
                hotelCount++;
                //helper.request_data(hotel_detail_options,new requestDetailData(cityId,h.id),hotel_page_data);
                this.todoHotels.push(h);
            }
        }
    }
    else{
	args[0].failedPageCount++;
	console.log("Failed %d/%d",args[0].failedPageCount,args[0].pageCount);
    }
    args[0].curPageIdx++;
}

MCtripHotel.prototype.processDetail = function(obj,args){
    var data=null;
    if(obj&&obj.Data){
        data = obj.Data;
    }else{
	console.log("Failed: %s",args[1].name);
	args[0].failedCount++;
    }
    if(data&&data!==''){
        data = helper.CtripUnPack(data);
        if(data&&data[0]){
            var h = args[1];
            h.commentCount=data[0].CommentTotal;
            h.custPoints = data[0].CustPoints;
            h.faclPoints= data[0].FaclPoints;
            h.raAtPoints = data[0].RaAtPoints;
            h.ratPoints = data[0].RatPoints;
            h.servPoints = data[0].ServPoints;
            if(data[0].HotelPicList)
                h.picCount = data[0].HotelPicList.length;
            if(data[0].RoomDetailList){
                for(var i in data[0].RoomDetailList){
                    var r = data[0].RoomDetailList[i];
                    var rm = new entity.room();
                    rm.id=r.RoomID;
                    rm.name=r.RoomName;
                    rm.price=r.RoomPrice||r.AvgPrice;
                    rm.breakfast = r.Breakfast;
                    rm.fan = r.FanDesc;
                    rm.gift = r.GiftName;
                    rm.isCu = r.IsCu;
                    rm.payType = r.PayType;
                    h.rooms.push(rm);
                }
		fs.appendFileSync(this.resultDir+this.resultFile,h.toString());
		fs.appendFileSync(this.resultDir+this.doneFile,h.id+"\n");
		console.log("Saved: %d/%d",++args[0].doneCount,args[0].totalCount);
            }
        }
    }
}

var instance = new MCtripHotel();
var that = instance;
instance.start();
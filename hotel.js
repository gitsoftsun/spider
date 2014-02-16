var http = require('http')
var zlib = require('zlib')
var fs = require('fs')

var sys = require('sys')
var entity = require('./models/entity.js')
var helper = require('./helpers/webhelper.js')

var hotel_list_options = new helper.basic_options('m.ctrip.com','/html5/Hotel/GetHotelList',"POST",true,true);
var hotel_detail_options= new helper.basic_options('/html5/Hotel/GetHotelDetail',"POST",true,true);

var hotelListData = {"CheckInCityID":"2","CheckInCity":"上海","isHot":2,"OrderName":0,"OrderType":1,"CheckInDate":"2014-02-23","PageNumber":1,"CheckOutDate":"2014-02-24","Days":"1","KeyWord":"","DistrictId":-1,"ZoneName":"","Zone":"","Location":"","LocationName":"","MetroId":"","MetroName":"","BrandId":"","BrandName":"","IsMorning":"0","isYesterdayOrder":false,"Star":""};
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
    this.CheckInDate= "2014-02-23";
    this.CheckOutDate="2014-02-24";
    this.CityID= cityId;
    this.HotelID= hotelId;
    this.IsMorning= "0";
};
entity.hotel.prototype.appendToFile=function(){
    
    var id=this.id;
    fs.appendFile("data.txt",this.toString(),function(e){
        if(e) console.log(e);
        else{
            fs.appendFile("doneHotels.txt",id+"\r\n");
            doneHotels[id]=true;
        }
        console.log(++doneHotelCount+"/"+hotelCount);
        if(doneHotelCount==hotelCount) console.log("job complete.\r\n");
    });
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
fs.readFileSync('TextFile1.txt').toString().split("\r\n").forEach(function(line){
    var pyh = line.split(' ');
    var id = pyh[0].match(/\d+/);
    var name = pyh[1];
    cities[id]={"name":name,pageCount:1,curPageIdx:1,rd:null,gotPageIdx:0};
    cityCount++;
});
fs.readFileSync('doneHotels.txt').toString().split("\r\n").forEach(function(line){
    var id = line&&Number(line);
	if(id)
		doneHotels[id]=true;
});
var pageCount=1;
var curPageIdx=1;
var hotels={};

for(var k in cities){
    var c = cities[k];
    c["rd"] = hotelListData.clone();
    c["rd"]["CheckInCityID"]=k;
    c["rd"]["CheckinCity"]=c.name;
    c["rd"]["PageNumber"]=1;
    console.log("getting "+c.name+"...")
    get_res_data(c["rd"],one_page_data);
    
}

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

function one_page_data(obj,cityId){
    if (!obj || (obj.ServerCode != 1 && obj.ServerCode != 6)){
        return;
    }
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
                get_res_data(new requestDetailData(cityId,h.id),hotel_page_data,"detail");
            }
            console.log("got "+cities[cityId].curPageIdx+++"/"+cities[cityId].pageCount);    
        }
    }
    else console.log("failed "+ cities[cityId].curPageIdx+++"/"+cities[cityId].pageCount);
        
    while(cities[cityId]["rd"]["PageNumber"]<cities[cityId].pageCount){
        //++cities[cityId].curPageIdx;
        cities[cityId]["rd"]["PageNumber"]++;
        get_res_data(cities[cityId]["rd"],one_page_data);
    }
}

function get_res_data(json_data,fn,type){
    var strData = JSON.stringify(json_data);
    var opts=null;
    if(type=="detail"){
        hotel_detail_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        opts=hotel_detail_options;
        
    }
    else{
        hotel_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        opts=hotel_list_options;
    }
        
    var req = http.request(opts, function(res) {
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

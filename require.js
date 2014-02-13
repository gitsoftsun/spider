var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var StringBuilder = require('stringbuilder')
var sys = require('sys')

var hotel_list_options = {
	host:'m.ctrip.com',
	path:'/html5/Hotel/GetHotelList',
	port:80,
	method:'POST',
	headers: {
		'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
		"X-Requested-With":"XMLHttpRequest",
		"Accept":"application/json, text/javascript, */*; q=0.01",
		"Accept-Encoding":"gzip, deflate",
		"Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
		"Content-Type":"application/json",
		"X_FORWARDED_FOR":"58.99.128.66",
	}
};
var hotel_detail_options={
    host:'m.ctrip.com',
    path:'/html5/Hotel/GetHotelDetail',
    port:80,
    method:'POST',
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
        "X-Requested-With":"XMLHttpRequest",
        "Accept":"application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding":"gzip, deflate",
        "Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
        "Content-Type":"application/json",
        "X_FORWARDED_FOR":"58.99.128.66",
    }
};


var requestData = {"CheckInCityID":"2","CheckInCity":"上海","isHot":2,"OrderName":0,"OrderType":1,"CheckInDate":"2014-02-23","PageNumber":1,"CheckOutDate":"2014-02-24","Days":"1","KeyWord":"","DistrictId":-1,"ZoneName":"","Zone":"","Location":"","LocationName":"","MetroId":"","MetroName":"","BrandId":"","BrandName":"","IsMorning":"0","isYesterdayOrder":false,"Star":""};
requestData.clone=function(){
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
var hotel=function(){
    this.city="";
    this.id = 0;
    this.name = "";
    this.shortName = "";
    this.star=0;
    this.currency = "";
    this.lowPrice="";
    this.points="";
    this.zoneName="";
    this.picCount=0;
    this.commentCount=0;

    this.isGift=false;
    this.isNew=false;
    this.isFan=false;
    this.fanPrice=0;
    this.fanType="";
    this.isQuan=false;
    this.quanPrice=0;
    this.quanType="";
    this.isCu = false;
    this.isMp=false;
    this.isMorning=false;
    this.isStar=false;
    this.isRoomFull=false;

    
    this.faclPoints= "0";//设施
    this.raAtPoints = "0";//环境
    this.ratPoints = "0";//卫生
    this.servPoints = "0";//服务
    this.rooms = [];
};
var room = function(){
    this.id=0;
    this.name="";
    this.breakfast="";
    this.fan="";
    this.gift="";
    this.isCu=0;
    this.payType=1;
    this.price="";
};
hotel.prototype.appendToFile=function(){
    //console.log("hotel "+this.id+" room count: "+this.rooms.length);
    var sb = new StringBuilder({newline:'\r\n'});
    for(var i=0;i<this.rooms.length;i++){
        sb.append(this.city);
        sb.append(",");
        sb.append(this.name);
        sb.append(",");
        sb.append(this.zoneName==null?"":this.zoneName);
        sb.append(",");
        sb.append(this.star);
        sb.append(",");
        sb.append(this.rooms[i].name);
        sb.append(",");
        sb.append(this.rooms[i].price);
        sb.append(",");
        sb.append(this.commentCount);
        sb.append(",");
        sb.append(this.picCount);
        sb.append(",");
        sb.append(this.points);
        sb.append(",");
        sb.append(this.faclPoints);
        sb.append(",");
        sb.append(this.raAtPoints);
        sb.append(",");
        sb.append(this.servPoints);
        sb.append(",");
        sb.append(this.ratPoints);
        sb.append(",");
        var b;
        if(this.rooms[i].breakfast=="单早")
            b=1;
        else if(this.rooms[i].breakfast=="双早")
            b=2;
        else b=0;
        sb.append(b);
        sb.append(",");
        if(this.rooms[i].gift)
            sb.append(this.rooms[i].gift);
        else sb.append("");
        sb.append(",");
        sb.append(this.isCu==0?"N":"Y");
        sb.append(",");
        if(this.rooms[i].fanPrice)
            sb.append(this.rooms[i].fanPrice);
        else sb.append("");
        sb.append(",");
        sb.append(this.rooms[i].payType==0?"Y":"N");
        sb.append('\r\n');
    }
    var id=this.id;
//    sb.append(this.city+","+this.name+","+this.star+","+this.isCu+"\r\n");
    sb.build(function(err,result){
        if(err) {
            console.log(err);
			doneHotelCount++;
            return;
        }
        //console.log("writing "+id+"...");
        fs.appendFile("data.txt",result,function(e){
            if(e){
				console.log(e);
			}
			else{
				fs.appendFile("doneHotels.txt",id+"\r\n");
				doneHotels[id]=true;
			}
            console.log(++doneHotelCount+"/"+hotelCount);
            if(doneHotelCount==hotelCount) console.log("job complete.\r\n");
        });
    });
    
}


for(var k in cities){
    var c = cities[k];
    c["rd"] = requestData.clone();
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
        data = JSON.CtripUnPack(data);
        if(data&&data[0]){
            var h = hotels[data[0].HotelID];
            
            h.commentCount=data[0].CommentTotal;
            h.custPoints = data[0].CustPoints;
            h.faclPoints= data[0].FaclPoints;//设施
            h.raAtPoints = data[0].RaAtPoints;//环境
            h.ratPoints = data[0].RatPoints;//卫生
            h.servPoints = data[0].ServPoints;//服务
            if(data[0].HotelPicList)
                h.picCount = data[0].HotelPicList.length;
            if(data[0].RoomDetailList){
                for(var i in data[0].RoomDetailList){
                    var r = data[0].RoomDetailList[i];
                    var rm = new room();
                    rm.id=r.RoomID;
                    rm.name=r.RoomName;
                    rm.price=r.RoomPrice;
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
        a = JSON.CtripUnPack(a);
        if(a && a.length > 0 && a[0].TotalCount > 0 && a[0].HotelLists && a[0].HotelLists.length > 0){
            cities[cityId].pageCount=a[0].TotalPage;
            for(var i=0;i<a[0].HotelLists.length;i++){
                var h = new hotel();
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
    var options=null;
    if(type=="detail"){
        hotel_detail_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        options=hotel_detail_options;
        
    }
    else{
        hotel_list_options.headers['Content-Length'] = Buffer.byteLength(strData,'utf8');
        options=hotel_list_options;
    }
        
    var req = http.request(options, function(res) {
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

JSON.CtripUnPack = function(e) {
    var q = "return o;";
    for (var u = [], f = [], i = e[0], n = i.length, l = e.length, x = -1, A = -1, a = 0, p = 0, d, o; a < n; ++a) {
        f[++A] = i[a];
        if (typeof i[a + 1] == "object") {
            ++a;
            for (d = 1; d < l; ++d) {
                o = e[d];
                o[p] = i[a][o[p]]
            }
        }
        ++p
    }
    for (var k = 1; k < l; ++k)
        for (var g = e[k], c = 0; c < f.length; c++)
            if (typeof g[c] == "object")
                if (g[c] && g[c].length > 0) {
                    for (var t = [], h = [], s = g[c][0], m = s.length, v = g[c].length, w = -1, y = -1, b = 0, z = 0, j; b < m; ++b) {
                        h[++y] = s[b];
                        ++z
                    }
                    for (b = 0, m = h.length; b < m; ++b)
                        h[b] = 'o["'.concat(h[b].replace('"', "\\x22"), '"]=a[', b, "];");
                    var r = Function("o,a", h.join("") + q);
                    for (j = 1; j < v; ++j)
                        t[++w] = r({}, g[c][j]);
                    e[k][c] = t
                }
    for (a = 0, n = f.length; a < n; ++a)
        f[a] = 'o["'.concat(f[a].replace('"', "\\x22"), '"]=a[', a, "];");
    var r = Function("o,a", f.join("") + q);
    for (d = 1; d < l; ++d)
        u[++x] = r({}, e[d]);
    return u
};


var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then substring() 
    console.log("you entered: [" + 
        d.toString().substring(0, d.length-1) + "]");
    process.exit(0);
  });
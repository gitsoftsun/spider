var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

//command args: date,useproxy
var arguments = process.argv.splice(2);
var departDate = arguments[0] || '2014-06-01';
var useproxy = arguments[1]!=undefined;//flag to define if use proxy.
var resultFile = "../result/pc_elong_flight.txt";
var cityFile = '../appdata/qunar_flight_hot_city.txt';
var logFile = "../result/pc_elong_flight_log.txt";
var doneFile = "../result/pc_elong_flight_done.txt";
var cities = helper.get_cities(cityFile);
var doneCities={};
if(useproxy){
  var proxy = new helper.proxy();
  proxy.load("verified-2-25.txt");
  var requestCount=0;
}
//count request count.
function getProxy(){
  requestCount++;
  if(requestCount==5){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}
var elong_query = function(dcity,acity){
    this.DepartCityNameEn = dcity.pinyin;
    this.ArriveCityNameEn = acity.pinyin;
    this.DepartCityName=dcity.cname;
    this.ArrivalCityName=acity.cname;
    this.DepartCity = dcity.code;
    this.ArriveCity = acity.code;
    this.DepartDate=departDate;
    this.IsReturn="false";
    this.PageIndex = 0;
    this.FlightType='OneWay';
    this.PageName="list";
};



function init(){
  // var exists = fs.existsSync(resultFile);
  // if(exists)
  //   fs.unlinkSync(resultFile);
  doneCities = helper.syncDoneCities(doneFile);
}
function start(){
  init();
  console.log("program start.")
  for(var j=0;j<cities.length;j++){
    var dep = cities[j];
    for(var k=0;k<cities.length;k++){
        var arr = cities[k];
        if(k==j || doneCities[dep.cname+"-"+arr.cname] || citySkip[dep.cname+'-'+arr.cname]) continue;
        
        
        var eq = new elong_query(dep,arr);
        //cityFls[dep.cname+'-'+arr.cname]={'pageCount':1,'equery':eq};
        console.log("getting "+dep.cname+"-"+arr.cname);
        var opt = null;
        if(useproxy){
          var p = getProxy();
          opt = new helper.basic_options(p.host,"flight.elong.com/isajax/OneWay/S",'GET',false,true,eq,p.port);
        }else{
          opt = new helper.basic_options('flight.elong.com','/isajax/OneWay/S','GET',false,true,eq);
        }
        //opt.headers["referer"]="http://flight.elong.com/"+dep.pinyin+"-"+arr.pinyin+"/cn_day2.html";
        //get flight data from elong.com
        //helper.request_data(opt,null,elong_fls,[dep.cname,arr.cname]);
        request_data(opt,null,elong_fls,[dep.cname,arr.cname]);
    }
  }
}
var flights = {};
function filterFlightInfo(flightlist,reqQuery){
  for(var i=0;i<flightlist.length;i++){
    var flight = flightlist[i];
    var no = flight.SegmentList[0].FlightNumber;
    var fl=null;
    if(!flights[no]){
      fl = new entity.flight();
      fl.dname = reqQuery.DepartCityName;
      fl.aname = reqQuery.ArrivalCityName;
      fl.flightNo = no;
      fl.dTime = new Date(Number(flight.SegmentList[0].DepartureTime.match(/\d+/)[0])).toString().match(/\d+:\d+:\d+/)[0];
      fl.aTime = new Date(Number(flight.SegmentList[0].ArriveTime.match(/\d+/)[0])).toString().match(/\d+:\d+:\d+/)[0];
      fl.price = flight.SalePrice;
      flights[no]=fl;
    } 
    else
      fl = flights[no];
    
    var cabin = {};
    cabin.ctype = flight.ClassNameAuto;
    cabin.price = flight.SalePrice;
    cabin.tCount = flight.SegmentList[0].TicketCount;
    cabin.fan = flight.ItinerarySupportCoupon;
    fl.cabins.push(cabin);

    //request to get tui,gai,qian data.
    var query = {
      "flightNums":no,
      "channel":"AirShopping",
      "flag":"channel1",
      "fareid":0,
      "promotionid":0,
      "type":0,
      "flighttype":0,
      "pagename":"list",
      "arrivecitynameen":reqQuery.ArriveCityNameEn,
      "departcitynameen":reqQuery.DepartCityNameEn,
      "legIndex":0-0,
      "flightClassType":flight.SegmentList[0].FlightClass,
      "viewpath":"~/views/list/oneway.aspx",
      "seatlevel":"Y"
    };
    for(var k in reqQuery){
      query['request.'+k]=reqQuery[k];
    }
    var opt = null;
    if(useproxy){
      var p = getProxy();
      opt = new helper.basic_options(p.host,'flight.elong.com/isajax/flightajax/GetShoppingRestrictionRuleInfo','GET',false,true,query,p.port);
    }else{
      opt = new helper.basic_options('flight.elong.com','/isajax/flightajax/GetShoppingRestrictionRuleInfo','GET',false,true,query);
    }
    
    opt.headers["referer"]="http://flight.elong.com/"+reqQuery.DepartCityNameEn+"-"+reqQuery.ArriveCityNameEn+"/cn_day3.html";
    //helper.request_data(opt,null,getRule,[fl,cabin]);
    request_data(opt,null,getRule,[fl,cabin]);
  }
}
function elong_fls(data,args){
  var id = args[0]+"-"+args[1];
  if(!data||!data.success){
    var info = "there is no data of: "+id;
    console.log(info);
    fs.appendFile(logFile,info+"\r\n",function(err){});
    return;nnn
  }

  var AirCorpList = data.value.AirCorpList;
  var ArriveAirports = data.value.ArriveAirports;
  var DepartAirports = data.value.DepartAirports;
  var FlightLegList = data.value.FlightLegList;
  var RecommendLegList = data.value.RecommendLegList;
  if(!FlightLegList) return;
  if(!doneCities[id]){
    doneCities[id]={};
  }
  doneCities[id].total = FlightLegList.length+RecommendLegList.length;
  doneCities[id].cur = 0;
  console.log(id+" : "+doneCities[id].total);
  filterFlightInfo(FlightLegList,args[2]);
  filterFlightInfo(RecommendLegList,args[2]);
}

function getRule(data,args){
  if(!data||!data.success||!data.value)
    return;
  var vals = data.value.split("<br/>");
  var cabin = args[1];
  try{
    cabin.tui = vals[1]||'';
    cabin.gai = vals[3]||'';
    cabin.qian = vals[5]||'';  
  }
  catch(e){
    console.log(e.message+":getRule 130");
  }

  fs.appendFile(resultFile,args[0].toString("elong_pc",cabin),function(err){
    if(err) console.log(err.message);
    else{
      var id = args[0].dname+"-"+args[0].aname;
      ++doneCities[id].cur;
      console.log(id+" : "+doneCities[id].cur+"/"+doneCities[id].total+" done.");
      if(doneCities[id].cur==doneCities[id].total){
        fs.appendFile(doneFile,id+"\r\n",function(err){});  
      }
    }
  });
}



function request_data(opt,data,fn,args){
  var url = "http://"+opt.host+opt.path;
  http.get(url,function(res){
  var chunks = [];
    res.on('data',function(chunk){
        chunks.push(chunk);
    });
    res.on('end',function(){
        var buffer = Buffer.concat(chunks);
        var result = buffer.toString();
        var obj = JSON.parse(result);
        if(Array.isArray(args)){
          args.push(opt.data);
          fn(obj,args);  
        }else{
          fn(obj,[args,opt.data]);
        }
        
    });
    res.on('error',function(e){
        console.log(e.message);
    });
}).on("error",function(e){
  console.log(e.message);
  request_data(opt,data,fn,args);
});
}
var citySkip = {};
if(fs.existsSync('../appdata/invalidFlights.txt')){
    fs.readFileSync('../appdata/invalidFlights.txt')
	.toString()
	.split('\n')
	.reduce(function(pre,cur){
	    if(cur){
		cur = cur.replace('\r','');
		pre[cur]=true;
	    }
	    return pre;
	},citySkip);
}

start();
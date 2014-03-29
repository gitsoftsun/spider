var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
//var $ = require('jquery')
var cheerio = require("cheerio")
var entity = require('../models/entity.js')
var Iconv = require('iconv').Iconv


//command args: date,useproxy
var arguments = process.argv.splice(2);
var departDate = '2014-05-01';
var useproxy = arguments[0]!=undefined;//flag to define if use proxy.
var resultFile = "../result/pc_ctrip_flight.txt";
var cityFile = '../appdata/ctrip_flight_hot_city.txt';
var logFile = "../result/pc_ctrip_flight_log.txt";
var doneFile = "../result/pc_ctrip_flight_done.txt";
var cities = helper.get_cities(cityFile);
var doneCities={};
if(useproxy){
  var proxy = new helper.proxy();
  proxy.load("verified-03-03.txt");
  var requestCount=0;
}
//count request count.
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
var query = function(dcity,acity){
	this.DCity1 = dcity.code;
	this.ACity1 = acity.code;
	this.PassengerQuantity = 1;
	this.FlightSearchType = "S";
	this.DDate1 = departDate;
  // this.DepartCityNameEn = dcity.pinyin;
  // this.ArriveCityNameEn = acity.pinyin;
  // this.DepartCityName=dcity.cname;
  // this.ArrivalCityName=acity.cname;
  // this.DepartCity = dcity.code;
  // this.ArriveCity = acity.code;
  // this.DepartDate=departDate;
  // this.IsReturn="false";
  // this.PageIndex = 0;
  // this.FlightType='OneWay';
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
        if(k==j || doneCities[dep.cname+"-"+arr.cname] || citySkip[dep.cname+"-"+arr.cname]) continue;
        
        var pageName = dep.code+"-"+arr.code+"-day-1.html";
        var ctripQuery = new query(dep,arr);
        
        console.log("getting "+dep.cname+"-"+arr.cname);
        var opt = null;
        if(useproxy){
          var p = getProxy();
          opt = new helper.basic_options(p.host,"flights.ctrip.com/booking/"+pageName,'GET',false,false,ctripQuery,p.port);
        }else{
          opt = new helper.basic_options('flights.ctrip.com','/booking/'+pageName,'GET',false,false,ctripQuery);
        }
	var myAgent = new http.Agent();
	myAgent.maxSockets=1;
	opt.agent=myAgent;
	console.log("flights.ctrip.com/booking/"+pageName);
        //opt.headers["referer"]="http://flight.elong.com/"+dep.pinyin+"-"+arr.pinyin+"/cn_day2.html";
        //get flight data from elong.com
        //helper.request_data(opt,null,fls,[dep.cname,arr.cname]);
    }
  }
}

function fls(data,args){
	if(!data) {
		var info = "response of "+args[0]+"-"+args[1]+" is empty";
		fs.appendFileSync(logFile,info+'\r\n');
		console.log(info);
		return;
	}
	try{
//	var $data = $(data);
	    var $ = cheerio.load(data);
	}
	catch(e){
		console.log(e.message);
		return;
	}
	var resultBoxs = $("#searchresult div.search_box");
	if(resultBoxs.length==0){
	    fs.appendFileSync("../result/errorFile.txt",data);
		var info = "no search result of "+args[0]+"-"+args[1];
		fs.appendFileSync(logFile,info+'\r\n');
		console.log(info);
		return;
	}
	console.log("got avaliable page of "+args[0]+"-"+args[1]+",flights: "+resultBoxs.length);
	resultBoxs.each(function(i,item){
	    var fl = new entity.flight();
	    var metadata = $(this).attr("data").split("|");
	    fl.dname = args[0];
	    fl.aname = args[1];
	    fl.dTime = metadata[0];
	    fl.aTime = metadata[1];
	    fl.flightNo = $("table.search_table_header td.logo strong",this).text();
	    fl.planeType = $("span.model span",this).text();
	    fl.puncRate = $("table.search_table_header tr td",this).eq(4).find("div").eq(1).text();
	    fl.puncRate = fl.puncRate.replace('\r','').replace('\n','').trim();
		
	    $("table.search_table tr",this).each(function(i,item){
		var cabin = {};
		cabin.isSpec='N';
		cabin.isAgent = 'N';
		cabin.lv = 'N';
		cabin.hui = 'N';
		cabin.fan = '';
		cabin.tCount = '';
		var special = $("td.special",this).text().trim();
		if(special!='')
		    cabin.isSpec = 'Y';
		var agent = $("td.special span.agent",this).text().trim();
		if(agent!='')
		    cabin.isAgent = "Y";
		var strRule = $("td.rule span",this).attr("data-params");
		var r = new RegExp(/<\b\w{6}\b>([^<]*)<\/\b\w{6}\b><\b\w{4}\b>([^<]*)<\/\b\w{4}\b>/gi);
		var i=0;
		// process tui,gai,qian
		while ((result = r.exec(strRule)) != null)  {
		    if(i==0)
			cabin.gai = result[2];
		    else if(i==1)
			cabin.tui = result[2];
		    else if(i==2)
			cabin.qian = result[2];
		    else{

		    }
		    i++;
		}
		cabin.price = $("td.right span.lowestprice",this).text();
		var huiNode = $("td",this).eq(7).find("span");
		if(huiNode.length>0){
		    if(huiNode.text()=="惠飞宝"){
			cabin.hui = 'Y';
		    }
		    else if(huiNode.text()=="旅行套餐"){
			cabin.lv = 'Y';
		    }
		    else{
			cabin.fan = huiNode.text();
		    }
		}
		var tCountNode = $("td.center span.warning",this);
		if(tCountNode.length>0){
		    cabin.tCount = tCountNode.text();
		}
		cabin.ctype = $("td",this).eq(1).text().replace('\r','').replace('\n','').trim();
		
		cabin.discount = $("td",this).eq(2).text().replace('\r','').replace('\n','').trim();
		fl.cabins.push(cabin);
	    });
	    fs.appendFile(resultFile,fl.toString("ctrip_pc"),function(err){
		if(err) console.log(err.message);
		else{
		    if(i+1==resultBoxs.length)
			fs.appendFile(doneFile,args[0]+"-"+args[1]+'\r\n',function(){});
		    console.log(args[0]+"-"+args[1]+": "+(i+1)+"/"+resultBoxs.length);
		}
	    });
	});
}





var citySkip = {
	"南京-杭州":true,
	"杭州-南京":true,
   "北京-天津":true,
   "上海-杭州":true,
   "杭州-上海":true,
 "哈尔滨-沈阳":true,
 "长沙-南昌":true,
 "沈阳-哈尔滨":true,
 "福州-南昌":true,
 "天津-北京":true,
 "南昌-长沙":true,
 "南昌-福州":true,
 "青岛-丽江":true,
 "哈尔滨-丽江":true,
 "福州-丽江":true,
 "南昌-丽江":true,
 "太原-丽江":true,
 "丽江-青岛":true,
 "丽江-哈尔滨":true,
 "丽江-福州":true,
 "丽江-南昌":true,
 "丽江-太原":true,
 "青岛-济南":true,
 "哈尔滨-长春":true,
 "长沙-武汉":true,
 "沈阳-长春":true,
 "天津-济南":true,
 "丽江-长春":true,
 "丽江-三亚":true,
 "长春-哈尔滨":true,
 "长春-沈阳":true,
 "长春-丽江":true,
 "济南-青岛":true,
 "济南-天津":true,
 "三亚-丽江":true,
 "武汉-长沙":true,
 "丽江-海口":true,
 "三亚-海口":true,
 "海口-丽江":true,
 "海口-三亚":true,
 "丽江-贵阳":true,
 "贵阳-丽江":true,
 "长沙-郑州":true,
 "太原-郑州":true,
 "武汉-郑州":true,
 "郑州-长沙":true,
 "郑州-太原":true,
 "郑州-武汉":true,
 "大连-沈阳":true,
 "沈阳-大连":true,
 "厦门-福州":true,
 "福州-厦门":true,
 "南京-天津":true,
"深圳-广州":true,
"广州-深圳":true,
"天津-南京":true,
"杭州-南昌":true,
"南昌-杭州":true,
};

start();
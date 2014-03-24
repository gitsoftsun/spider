var webdriver = require('selenium-webdriver');
var helper = require('./helpers/webhelper.js')
var fs = require('fs')
var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).
    build();

// var http = require("http")

// var url = "http://flight.elong.com/isajax/OneWay/S?DepartCityNameEn=wulumuqi&ArriveCityNameEn=shanghai&DepartCityName=乌鲁木齐&ArrivalCityName=上海&DepartCity=URC&ArriveCity=SHA&DepartDate=2014-04-01&IsReturn=false&PageIndex=0&FlightType=OneWay";

// http.get(url,function(res){
	// var chunks = [];
    // res.on('data',function(chunk){
        // chunks.push(chunk);
    // });
    // res.on('end',function(){
        // var buffer = Buffer.concat(chunks);
     	// console.log(buffer.toString());
    // });
    // res.on('error',function(e){
        // console.log(e.message);
    // });
// });
var url = "http://flights.ctrip.com/booking/BJS-SHA-day-1.html?DCity1=BJS&ACity1=SHA&DDate1=2014-04-01&passengerQuantity=1&PassengerType=ADU&SearchType=S&RouteIndex=1&RelDDate=&RelRDate=&IsSensitive=T&SendTicketCity=undefined"
var cityFile = "qunar_flight_hot_city.txt";
var departDate="2014-04-01";
var cities = helper.get_cities(cityFile);
var cs = [];
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
function start(){
	var doneFiles = fs.readdirSync("pc_ctrip_flight");
	var doneDict={};
	for(var i=0;i<doneFiles.length;i++){
		var id = doneFiles[i].replace(".html");
		doneDict[id]=true;
	}
	for(var j=0;j<cities.length;j++){
    var dep = cities[j];
    for(var k=0;k<cities.length;k++){
        var arr = cities[k];
        if(k==j || doneDict[dep.cname+"-"+arr.cname]) continue;
		cs.push({"dep":dep,"arr":arr});
    }
  }
  var cur = cs.pop();
	var pageName = cur.dep.code+"-"+cur.arr.code+"-day-1.html";
	var ctripQuery = new query(cur.dep,cur.arr);
	url = "http://flights.ctrip.com/booking/"+pageName+helper.toQuery(ctripQuery);
	requestdata(url,[cur.dep,cur.arr]);
}
function requestdata(url,args){
	//var args = ["北京","上海"];
	driver.get(url).then(
	function(){
		var source_code = driver.getPageSource();
		//var source_code = elem.get_attribute("outerHTML");
		fs.writeFileSync("pc_ctrip_flight/"+args[0].cname+'-'+args[1].cname+'.html',source_code);
		console.log(args[0]+"-"+args[1]+" done.");
		if(cs.length==0) return;
		var cur = cs.pop();
		var pageName = cur.dep.code+"-"+cur.arr.code+"-day-1.html";
        var ctripQuery = new query(cur.dep,cur.arr);
		url = "http://flights.ctrip.com/booking/"+pageName+helper.toQuery(ctripQuery);
		requestdata(url,[cur.dep,cur.arr]);
	});

}
start();
var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')

var departDate = '2014-04-01';
var app_elong_done_flight_file = "app_elong_done_flights.txt";

var elong_query = function(dname,aname){
this.DepartCityName=dname;
this.ArrivalCityName=aname;
this.DepartDate=departDate;
this.IsReturn="false";
this.PageIndex = 0;
};

var citySkip = {};
var cityFls = {};
var cities = helper.get_cities('qunar_flight_hot_city.txt');
var proxy = new helper.proxy();
var doneCities = {};

function syncDoneCities(){
  if(!fs.existsSync(app_elong_done_flight_file)) return;
  var lines = fs.readFileSync(app_elong_done_flight_file).toString().split('\r\n');
  for(var i=0;i<lines.length;i++){
    doneCities[lines[i]] = true;
  }
  console.log(lines.length+" cities' flights has been done.");
}

function start(){
  syncDoneCities();
for(var j=0;j<cities.length;j++){
  var dep = cities[j];
  for(var k=0;k<cities.length;k++){
      if(k==j) continue;
      var arr = cities[k];
      if(doneCities[dep.cname+'-'+arr.cname] || citySkip[dep.cname+'-'+arr.cname]) continue;

      var eq = new elong_query(dep.cname,arr.cname);
      //var qq = new qunar_query(dep.cname,arr.cname);
      cityFls[dep.cname+'-'+arr.cname]={'pageCount':1,'equery':eq};
      //get flight data from elong.com
      helper.request_data(
        new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,eq),
        null,
        elong_fls,
        [dep.cname,arr.cname]
        );
      //get flight data from qunar.com
      console.log("getting "+dep.cname+'-'+arr.cname + "...");
  }
}
}
var flights = {};

function elong_fls(data,args){
  //var doc = $(fs.readFileSync('elongflight.html').toString());
  var doc = $(data);
  if(doc.find('ul.ui_list>li>a').length==0) return;

  doc.find('ul.ui_list > li>a').each(function(i,a){
  var fl = new entity.flight();

  var href = a.getAttribute('href');
  
  var id = href.match(/\w+\-\w+-\w+/);
  //var d2a = id[0].match(/\w+\-\w+/)[0];
  fl.id=id[0];
  var spans = a.getElementsByTagName('span');
  
  fl.price = spans[1].innerHTML;
  fl.cmpName = spans[2].innerHTML.trim();
  fl.flightNo = spans[3].innerHTML.trim();
  fl.planType = spans[4].innerHTML.trim();
  fl.daname = spans[5].innerHTML.trim();
  fl.aaname = spans[6].innerHTML.trim();
  //tCount = spans[7].innerHTML.trim();
  fl.dTime = spans[8].innerHTML.trim();
  fl.aTime = spans[9].innerHTML.trim();
  fl.dname = args[0]||'北京';
  fl.aname = args[1]||'上海';
  flights[fl.id]=fl;
  helper.request_data(
  new helper.basic_options('m.elong.com','/Flight/'+fl.id+'.html','GET',true,false,{'DepartDate':departDate}),
  null,
  elong_fl,
  [fl.id,args[0],args[1]]);
});
var identifier = args[0]+'-'+args[1];
  doc.find('div#uiPager > span').each(function(x,span){
    var pageCount = Number(span.innerHTML.match(/\d+/g)[1]);
    cityFls[identifier].pageCount  =pageCount;
  });
  console.log(identifier+":"+(cityFls[identifier].equery.PageIndex+1)+"/"+cityFls[identifier].pageCount);
while(cityFls[identifier].equery.PageIndex<cityFls[identifier].pageCount-1){
  cityFls[identifier].equery.PageIndex++;
  helper.request_data(
    new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,cityFls[identifier].equery),
    null,
    elong_fls,
    args.slice(0,args.length-1));
}
}


function elong_fl(doc,args){
  var $doc = $(doc);
  $doc.find('div#ui_accordion1').each(function(i,list){
    var $list = $(list);
    $list.find('label > table').each(function(j,tbody){
      var cabin = {};
      var trs = tbody.getElementsByTagName('tr');
      var tds = trs[0].getElementsByTagName('td');
      cabin.ctype = tds[0].childNodes[0].value.trim();
      cabin.tCount = tds[0].childNodes[1].innerHTML.trim();
      cabin.price = trs[1].getElementsByTagName('span')[0].innerHTML.trim();
      var cabins = flights[args[0]]&&flights[args[0]].cabins;
      cabins.push(cabin);
    });
    $list.find('div.ui_accordion_content').each(function(k,cnt){
      flights[args[0]].cabins[k].tui = cnt.childNodes[2].value.trim();
      flights[args[0]].cabins[k].gai = cnt.childNodes[6].value.trim();
    });
    
    fs.appendFile("app_elong_flight.txt",flights[args[0]].toString(),function(err){
      if(err) console.log(err.message);
      else{
      	fs.appendFile(app_elong_done_flight_file,args[1]+"-"+args[2]+'\r\n',function(){});
      }
    });

  });
}


start();
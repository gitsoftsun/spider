var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')

var departDate = '2014-03-01';
var app_qunar_done_city_file = "app_qunar_done_city.txt";

var elong_query = function(dname,aname){
this.DepartCityName=dname;
this.ArrivalCityName=aname;
this.DepartDate=departDate;
this.IsReturn="false";
this.PageIndex = 0;
};
var elong_options = new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,new elong_query('北京','上海'));

var qunar_query = function(dname,aname){
  this.begin=encodeURIComponent(dname);
  this.end=encodeURIComponent(aname);
  this.date=departDate.replace(/\-/g,'');
  this.time=0;
  this.v=2;
  this.f="index";
  this.bd_source='';
  this["page.currPageNo"]=1;
}

var citySkip = {
  "北京-天津":true,
"哈尔滨-沈阳":true,
"长沙-南昌":true,
"沈阳-哈尔滨":true,
"福州-南昌":true,
"天津-北京":true,
"南昌-长沙":true,
"南昌-福州":true,
"南昌-太原":true,
"太原-南昌":true,
"青岛-丽江":true,
"哈尔滨-丽江":true,
"沈阳-丽江":true,
"福州-丽江":true,
"南昌-丽江":true,
"太原-丽江":true,
"丽江-青岛":true,
"丽江-哈尔滨":true,
"丽江-沈阳":true,
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
"丽江-武汉":true,
"长春-哈尔滨":true,
"长春-沈阳":true,
"长春-丽江":true,
"济南-青岛":true,
"济南-天津":true,
"三亚-丽江":true,
"武汉-长沙":true,
"武汉-丽江":true,
"丽江-海口":true,
"三亚-海口":true,
"海口-丽江":true,
"海口-三亚":true,
"丽江-贵阳":true,
"长春-贵阳":true,
"贵阳-丽江":true,
"贵阳-长春":true,
"长沙-郑州":true,
"太原-郑州":true,
"武汉-郑州":true,
"郑州-长沙":true,
"郑州-太原":true,
"郑州-武汉":true
};


var requestCount = 0;
var qunar_options = new helper.basic_options('m.qunar.com','/search.action','GET',true,false,qunar_query);
var cityFls = {};
var cities = helper.get_cities('qunar_flight_hot_city.txt');
var proxy = new helper.proxy();
var proxyfile = "verified-2-25.txt";
proxy.load(proxyfile);
// var proxysGetterTimer = setInterval(function(){
//   helper.fetchProxys(proxyfile);
// },600000);
var proxysReaderTimer = setInterval(function(){
  proxy.load(proxyfile);
},30000);

var doneCities = {};

function syncDoneCities(){
  if(!fs.existsSync(app_qunar_done_city_file)) return;
  var lines = fs.readFileSync(app_qunar_done_city_file).toString().split('\r\n');
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
      var qq = new qunar_query(dep.cname,arr.cname);
      cityFls[dep.cname+'-'+arr.cname]={'pageCount':1,'equery':eq,'qquery':qq};
      //get flight data from elong.com
      // helper.request_data(
      //   new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,eq),
      //   null,
      //   elong_fls,
      //   [dep.cname,arr.cname]
      //   );
      //get flight data from qunar.com
      console.log("getting "+dep.cname+'-'+arr.cname + "...");
      var p = getProxy();
      helper.request_data(
        new helper.basic_options(p.host,'http://m.qunar.com/search.action','GET',true,false,qq,p.port),
        //new helper.basic_options('m.qunar.com','/search.action','GET',true,false,qq,null),
        null,
        qunarfl,
        [dep.cname,arr.cname]
        );
  }
}
}

start();

function getProxy(){
  requestCount++;
  if(requestCount==3){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}

function qunarfl(data,args){
if(Buffer.byteLength(data)==1939){
  console.log("current ip has been forbidden.");
  return;
}
  var doc = $(data);
  if(doc.find("table.fl > tr").length==0) return;
  if(doc.find("div.ct p:last-child").length==0) return;
  var sb = new helper.StringBuffer();
  doc.find("table.fl > tr").each(function(i,tr){
  //console.log(i);
  
  var cols = tr.getElementsByTagName('td');
  if(cols!=null){
    var fcompany = cols[1].childNodes[0].value;
  var flno = cols[1].childNodes[1].innerHTML;
  //var da = cols[1].childNodes[3] && cols[1].childNodes[3].value.trim();

  var pricePic = cols[2].childNodes[1].getAttribute("src");
  var discount = cols[2].childNodes[3].innerHTML;
  var times = cols[2].childNodes[5].value.trim().split('-');
  var dtime = times[0];
  var atime = times[1];

  sb.append(args[0]);
  sb.append(',');
  sb.append(args[1]);
  sb.append(',');
  sb.append(fcompany+" "+flno);
  sb.append(',');
  sb.append(dtime);
  sb.append(',');
  sb.append(atime);
  sb.append(',');
  sb.append(pricePic);
  sb.append('\r\n');
  }
  
});
  fs.appendFile("app_qunar_flight.txt",sb.toString(),function(err){
    if(err) console.log(err.message);
  });

  var total = doc.find("div.ct p:last-child")[0].innerHTML.match(/\d+/);
  var pageCount = Math.ceil(total/10);
  var cityf = cityFls[args[0]+'-'+args[1]];
  cityf.pageCount = pageCount;

  console.log(args[0]+'-'+args[1]+cityf.qquery["page.currPageNo"]+'/'+pageCount);
  if(cityf.pageCount == cityf.qquery["page.currPageNo"]){
    fs.appendFile(app_qunar_done_city_file,args[0]+'-'+args[1]+'\r\n',function(err){
      if(err) console.log(err.message);
    });
  }

  while(cityf.qquery['page.currPageNo']<pageCount){
    cityf.qquery['page.currPageNo']++;
    var p = getProxy();
    helper.request_data(
    new helper.basic_options(p.host,'http://m.qunar.com/search.action','GET',true,false,cityf.qquery,p.port),
    //new helper.basic_options('m.qunar.com','/search.action','GET',true,false,cityf.qquery,null),
    null,
    qunarfl,
    args
    );
    
    
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
  new helper.basic_options('m.elong.com','/Flight/'+fl.id+'.html','GET',true,false,{'DepartDate':"2014-03-01"}),
  null,
  elong_fl,
  fl.id);
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
    
    fs.appendFile("app_elong_flight-03-01.txt",flights[args[0]].toString(),function(err){
      if(err) console.log(err.message);
    });

  });
}

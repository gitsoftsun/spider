var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')


var elong_query = {};
elong_query.DepartCityName="北京";
elong_query.ArrivalCityName="上海";
elong_query.DepartDate="2014-02-23";
elong_query.IsReturn="false";

var elong_options = new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,elong_query);

var qunar_query = {};
qunar_query.begin="北京";
qunar_query.end="上海";
qunar_query.date="20140223";
qunar_query.time=0;
qunar_query.v=2;
qunar_query.f="index";
qunar_query.bd_source='';
qunar_query["page.currPageNo"]=1;

var qunar_options = new helper.basic_options('m.qunar.com','/search.action','GET',true,false,qunar_query);


// helper.request_data(elong_options,null,function(data){
//   fs.appendFileSync('elongflight.html',data);
// });//,args);


// var req = http.get(options, function(res) {
//   console.log('STATUS: ' + res.statusCode);
//   console.log('HEADERS: ' + JSON.stringify(res.headers));
//   //res.setEncoding('utf8');
//   var chunks=[];
  
//   res.on('data', function (chunk) {
//     console.log('BODY: ' + chunks.push(chunk));
//   });
//   res.on('end',function(){
//   	if(res.headers['content-encoding']=='gzip'){
//   	var buffer = Buffer.concat(chunks);
//   	zlib.gunzip(buffer,function(err,decoded){
//   		//fs.writeFile('data.html',decoded.toString(),function(err){
//   		//	if(err) throw err;
//   		//	console.log('file saved.');
//       console.log(decoded&&decoded.toString());
//   		//});
//   	});
//   }
//   });
// });


//var firstVisit = http.get("m.ctrip.com/html5/Hotel/",function(res){
//	console.log(res.headers["Set-Cookie"]);
	
//});
// firstVisit.on('error',function(err){
// 	console.log(err);
// })

function processfl(data){
  var doc = $(data);
  doc.find("table.fl > tr").each(function(i,tr){
  //console.log(i);
  var sb = new helper.StringBuffer();
  var cols = tr.getElementsByTagName('td');

  var fcompany = cols[1].childNodes[0].value;
  var flno = cols[1].childNodes[1].innerHTML;
  var da = cols[1].childNodes[3].value.trim();

  var pricePic = cols[2].childNodes[1].getAttribute("src");
  var discount = cols[2].childNodes[3].innerHTML;
  var times = cols[2].childNodes[5].value.trim().split('-');
  var dtime = times[0];
  var atime = times[1];

  console.log(p.join(','));
});
}

var flights = {};
function elong_fls(doc,args){
  var doc = $(fs.readFileSync('elongflight.html').toString());
  doc.find('ul.ui_list > li>a').each(function(i,a){
  var fl = new entity.flight();

  var href = a.getAttribute('href');
  
  var id = href.match(/\w+\-\w+-\w+/);
  
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
  new helper.basic_options('m.elong.com','/Flight/'+fl.id+'.html','GET',true,false,{'DepartDate':"2014-02-23"}),
  null,
  elong_fl,
  fl.id);
});  
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
      var cabins = flights[args]&&flights[args].cabins;
      cabins.push(cabin);
    });
    $list.find('div.ui_accordion_content').each(function(k,cnt){
      flights[args].cabins[k].tui = cnt.childNodes[2].value.trim();
      flights[args].cabins[k].gai = cnt.childNodes[6].value.trim();
    });
    
    fs.appendFile("app_elong_flight.txt",flights[args].toString(),function(err){
      if(err) console.log(err.message);
    });

  });
}

elong_fls(null,['','']);
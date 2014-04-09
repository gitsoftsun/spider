var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require("cheerio")
var entity = require('../models/entity.js')


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
	var opt = null;
	if(useProxy){
		var p = getProxy();
		opt = new helper.basic_options(p.host,'http://m.qunar.com/search.action','GET',true,false,cityf.qquery,p.port);
	}else{
		opt = new helper.basic_options('m.qunar.com','/search.action','GET',true,false,cityf.qquery,null);
	}
    
    helper.request_data(
	opt,
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


function MQunarFlight(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "app_qunar_flight.txt";
    this.doneFile = "app_qunar_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.departDate = "20140501";
    this.cityFile = "qunar_flight_hot_city.txt";

    this.citySkip = {};
    this.cities = [];
    this.doneFlights = {};
    this.todoFlights=[];

    this.qunarQuery = function(dname,aname,pidx){
	this.begin=encodeURIComponent(dname);
	this.end=encodeURIComponent(aname);
	this.date=that.departDate;
	this.time=0;
	this.v=2;
	this.f="index";
	this.bd_source='';
	this["page.currPageNo"]=pidx?pidx:1;
    }
}

MQunarFlight.prototype.init = function(){
    this.cities = helper.get_cities(this.dataDir+this.cityFile);
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.cities.length;j++){
	    if(i==j)
		continue;
	    var n = this.cities[i].cname+'-'+this.cities[j].cname;
	    if(!this.doneFlights[n] && !this.citySkip[n])
		this.todoFlights.push({
		    d:this.cities[i],
		    a:this.cities[j]
		});
	}
    }    
}

MQunarFlight.prototype.start = function(){
    this.load();
    this.init();
    console.log("%d flights todo.",this.todoFlights.length);
    this.wgetList();
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

MQunarFlight.prototype.load=function(){
    if(fs.existsSync(this.resultDir+this.doneFile)){
	fs.readFileSync(this.resultDir+this.doneFile)
	    .toString()
	    .split('\r\n')
	    .reduce(function(pre,cur){
		if(cur)
		    pre[cur]=true;
		return pre;
	    },this.doneFlights);
    }
    if(fs.existsSync(this.dataDir+this.skipFile)){
	fs.readFileSync(this.dataDir+this.skipFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,cur){
		if(cur){
		    cur = cur.replace('\r','');
		    pre[cur]=true;
		}
		return pre;
	    },this.citySkip);
    }
}

MQunarFlight.prototype.processList = function(data,args){
    if(Buffer.byteLength(data)==1939){
	console.log("current ip has been forbidden.");
	return;
    }
    var $ = cheerio.load(data);
    var sb = new helper.StringBuffer();
    $("table.fl > tr").each(function(i,tr){
	var cols = $('td',this);
	var fcompany = cols.eq(1).contents().first().text();
	var flno = cols.eq(1).contents().eq(1).text();
	var pricePic = cols.eq(2).contents().eq(1).attr('src');
	var discount = cols.eq(2).contents().eq(3).text();
	var times = cols.eq(2).contents().eq(5).text().trim().split('-');
	var dtime = times[0];
	var atime = times[1];

	sb.append(args[0].d.cname);
	sb.append(',');
	sb.append(args[0].a.cname);
	sb.append(',');
	sb.append(fcompany+" "+flno);
	sb.append(',');
	sb.append(dtime);
	sb.append(',');
	sb.append(atime);
	sb.append(',');
	sb.append(pricePic);
	sb.append('\r\n');
    });
    fs.appendFileSync(this.resultDir+this.resultFile,sb.toString());

    if(args[0].pageCount==undefined){
	var total = $("div.ct p:last-child").eq(0).text().match(/\d+/);
	var pageCount = Math.ceil(total/10);
	args[0].pageCount = pageCount;
    }
    if(args[0].pageIdx == undefined)
	args[0].pageIdx = 1;
    if(args[0].pageCount == args[0].pageIdx){
	fs.appendFileSync(this.resultDir+this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
    }
    args[0].pageIdx++;
    this.wgetList(args[0]);
/*    
    while(args[0].pageIdx<args[0].pageCount){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},2000);
    }
    */
}

MQunarFlight.prototype.wgetList = function(f){
    if(!f || f.pageIdx>f.pageCount){
	if(this.todoFlights.length==0) return;
	f = this.todoFlights.pop();
    }
    
    console.log("GET %s-%s: %d/%d",f.d.cname,f.a.cname,f.pageIdx,f.pageCount);
    var query = new this.qunarQuery(f.d.cname,f.a.cname,f.pageIdx);
    var opt = new helper.basic_options('m.qunar.com','/search.action','GET',true,false,query);
    opt.agent=false;
    helper.request_data(opt,null,function(data,args){
	that.processList(data,args);
    },f);
}

var instance = new MQunarFlight();
var that = instance;
instance.start();
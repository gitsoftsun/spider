var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

function MQunarFlight(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "app_qunar_flight.txt";
    this.doneFile = "app_qunar_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.departDate = "20141001";
    this.cityFile = "qunar_flight_hot_city.txt";

    this.citySkip = {
	'太原-济南':true,
	'南昌-武汉':true,
	'南昌-长春':true,
	'武汉-南昌':true,
	'三亚-大连':true,
	'济南-太原':true,
	'济南-丽江':true,
	'长春-南昌':true,
	'长春-大连':true,
	'丽江-济南':true,
	'丽江-南宁':true
    };
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
var sleepTime = 2400000;
var sleepCount = 0;
MQunarFlight.prototype.processList = function(data,args){
    if(Buffer.byteLength(data)==1939){
	console.log("current ip has been forbidden.");
	//setTimeout(function(){
	//    that.wgetList(args[0]);
	//},sleepTime);
	//sleepCount++;
	//sleepTime*=sleepCount+1;
	return;
    }else{
	sleepTime = 2400000;
	sleepCount = 0;
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
//    setTimeout(function(){
//	that.wgetList(args[0]);
//    },(Math.random()*3+20)*1000);
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
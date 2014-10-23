var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.host = '58.com';
    this.lastSendTime = new Date();
    this.cities = [];
    this.cityFile = "58.regions.txt";
    this.resultFile = '58_rent.txt';
    this.pagePerTask = 100;
}

Rent.prototype.init = function(){
    this.cities = JSON.parse(fs.readFileSync(this.dataDir+this.cityFile).toString());
    /*
    this.cities = fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if (!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });
    */
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
	var city = this.cities[i];
	for(var j=0;j<city.districts.length;j++){
	    var district = city.districts[j];
	    if(district.regions.length==0){
		var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin};
		this.tasks.push(tmp);
		///fs.appendFileSync(this.resultDir+"tasksout.txt",JSON.stringify(tmp)+'\n');
	    }else{
		for(var k=0;k<district.regions.length;k++){
		    var region = district.regions[k];
		    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin}
		    this.tasks.push(tmp);
		    ///fs.appendFileSync(this.resultDir+"tasksout.txt",JSON.stringify(tmp)+'\n');
		}
	    }
	}
    }
    
    var arguments = process.argv.splice(2);
    var start = arguments[0];
    var len = arguments[1];
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
}

Rent.prototype.start = function(){
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(t){
    if(!t){
	if(this.tasks.length==0){
	    console.log("job done.");
	    return;
	}
	t = this.tasks.shift();
	t.pn = 1;
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+pinyin+"/chuzu/pn"+t.pn+"/");
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %d",t.cityName,t.districtName,name==t.districtName?"":name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
	console.log("data empty.");
	return;
    }
    
    var $ = cheerio.load(data);
    var memberCount = 0;
    $("div#infolist > table.tbimg tr").each(function(){
	var td = $("td.t.qj-rentd",this);
	var name = $("h1 a.t",td).text().replace(/[\n\r,，]/g,";");
	var url = $("h1 a.t",td).attr("href");
	var wlt = $("h1 span.wlt-ico",td);
	var member = 0;
	if(wlt.length>0){
	    member = wlt.attr("class").replace(/wlt-ico wlt/,"");
	}
	if(member)
	    memberCount++;
	var jing = $("h1 span.jingpin",td).length;
	var top = $("h1 span.ico.ding",td).length;
	var personal = $("h1 span.qj-renttitgr",td).text();
	personal = personal && personal.trim().replace(/[\(\)]/g,"");
	var addr = $("p.qj-renaddr",td).text().trim().replace(/[\s]/g,"").replace(/[,，]/g,";");
	var addrInfos = addr.split("/");
	var houseName,pubDate;
	if(addrInfos.length>0)
	    houseName= addrInfos[0].trim();
	if(addrInfos.length>1)
	    pubDate = addrInfos[1].trim();
	var jjrLine = $("p.qj-rendp span.qj-listjjr",td);
	var jjrName,jjcmp,jjbranchcmp;
	if(jjrLine.length>0){
	    var jjrInfo = $("a",jjrLine);
	    if(jjrInfo.length>0){
		jjrName = jjrInfo.eq(0).text().trim();
	    }
	    if(jjrInfo.length>1){
		jjcmp = jjrInfo.eq(1).text().trim();
	    }
	    if(jjrInfo.length>2){
		jjbranchcmp = jjrInfo.eq(2).text().trim();
	    }
	}
	var record = [name,url,args[0].cityName,args[0].districtName,args[0].regionName||"",member,jing,top,personal,houseName||"",pubDate||"",jjrName||"",jjcmp||"",jjbranchcmp||"","\n"].join();
	fs.appendFileSync(that.resultDir+that.resultFile,record);
	console.log("[DONE] %s",record);
    });

    if ($("div#infolist > table.tbimg tr").length<10 || memberCount<4) {
        console.log("[DONE] less info,Region: " + args[0].regionName);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 2 + 2) * 1000);
    } else if (data.search('pager') != -1 && args[0].pn < this.pagePerTask) {
        data = null;
        args[0].pn++;
        setTimeout(function () {
            that.wgetList(args[0]);
        }, (Math.random() * 2 + 2) * 1000);
    } else {
        console.log("[DONE] Region: " + args[0].regionName);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 2 + 2) * 1000);
    }
}

var instance = new Rent();
var that = instance;
that.start();

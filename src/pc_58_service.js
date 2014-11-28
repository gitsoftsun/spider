var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.services = [];
    this.serviceFile = "58.service.category.txt";
    this.resultFile = '58_service.txt';
    this.pagePerTask = 100;
}

Rent.prototype.init = function(){
    //load city from file
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });

    //load service category file
    this.services = fs.readFileSync(this.dataDir+this.serviceFile).toString().split('\n').map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return {"cat1_name": vals[0], "cat2_name": vals[1], "cat3_name": vals[2], "cat3_enname": vals[3]};
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat1_name":service.cat1_name,"cat2_name":service.cat2_name,"cat3_name":service.cat3_name,"cat3_enname":service.cat3_enname};
            this.tasks.push(tmp);
        }
    }

    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
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
        console.log('task left: %d', this.tasks.length);
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.cat3_enname+"/pn"+t.pn+"/");
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.cat3_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        console.log("data empty.");
    }

    var $ = cheerio.load(data);
    var memberCount = 0;
    $("div#infolist > table.small-tbimg tr").each(function(){
	var td = $("td.t",this);
	var title = $("a.t",td).text().replace(/[\n\r,，]/g,";");
	var user = $("a.u",td).text().replace(/[\n\r,，]/g,";");
	var url_title = $("a.t",td).attr("href");
	var url_user = $("a.u",td).attr("href");
	var wlt = $("span[class^='wlt']",td);
	var member = 0;
	if(wlt.length>0){
	    member = wlt.attr("class").replace(/wlt/,"");
	}
	if(member)
	    memberCount++;
	var jing = $("span.jingpin",td).length;
	var top = $("span.ico.ding",td).length;
    //var personal = $("h1 span.qj-renttitgr",td).text();
	//personal = personal && personal.trim().replace(/[\(\)]/g,"");
	//var houseName = $("div.qj-listleft>a",td).text().trim().replace(/[\s]/g,"").replace(/[,，]/g,";");

	//var pubDate = $("div.qj-listleft span.qj-listjjr",td).contents().last().text().trim();

	var record = [args[0].cityName,args[0].cat1_name,args[0].cat2_name,args[0].cat3_name,member,jing,top,title,user,url_title,url_user,"\n"].join();
	fs.appendFileSync(that.resultDir+that.resultFile,record);
	//console.log("[DONE] %s",record);
    });

    if ($("div#infolist > table.small-tbimg tr").length<10 || memberCount<4) {
        console.log("[DONE] less info,Category: " + args[0].cat3_name);
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
        console.log("[DONE] Category: " + args[0].cat3_name);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 2 + 2) * 1000);
    }
}

var instance = new Rent();
var that = instance;
that.start();

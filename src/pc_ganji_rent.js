var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = "ganji.regions.txt";
    this.resultFile = 'ganji_rent.txt';
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
		//fs.appendFileSync(this.resultDir+"tasksout.ganji.txt",JSON.stringify(tmp)+'\n');
	    }else{
		for(var k=0;k<district.regions.length;k++){
		    var region = district.regions[k];
		    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin}
		    this.tasks.push(tmp);
		    //fs.appendFileSync(this.resultDir+"tasksout.ganji.txt",JSON.stringify(tmp)+'\n');
		}
	    }
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
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/fang1/"+pinyin+"/o"+t.pn+"/");
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
    $("ul.list-style1 li div.list-mod4").each(function(){
	var link = $("div.info-title>a",this);
	var name = link.attr("title").trim().replace(/[\s,，]/g,"");
	var url = link.attr("href");
	var personal = $("span.fc-red",link).text();
	personal = personal && personal.replace(/[\s\(\)]/g,"");
	
	var words = $("div.list-mod2 div.list-word span",this);
	var houseName,addr;
	if(words.length>0){
	    houseName = words.eq(0).text().trim();
	}
	if(words.length>1){
	    addr = words.eq(1).text().trim();
	}
	houseName = houseName && houseName.replace(/[\s,，]/g,'');
	words = $("div.list-mod2 p.list-word",this).text().trim();
	words = words && words.split("/");
	var pubDate = words[words.length-1];
	
	var member = $("div.list-mod3 p.gj-bang-box span",this).text()||0;
	if(member)
	    memberCount++;
	var top = $("a em.ico-stick-yellow",link).length;
	var adTop = $("a em.ico-stick-red",link).length;
	var jing = $("span.ico-hot",link).length;
	//jjrName||"",jjcmp||"",jjbranchcmp||""
	var record = [name,url,args[0].cityName,args[0].districtName,args[0].regionName||"",member,jing,top,adTop,personal,houseName||"",pubDate||"","\n"].join();
	fs.appendFileSync(that.resultDir+that.resultFile,record);
	console.log("[DONE] %s",record);
    });
    if ($("ul.list-style1 li").length<10 || memberCount<4) {
        console.log("[DONE] less info,Region: " + args[0].regionName);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 2 + 2) * 1000);
    } else if ($('.pageLink li a').last().attr("class") == "next" && args[0].pn < this.pagePerTask) {
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

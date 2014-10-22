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
}

Rent.prototype.init = function(){
    this.cities = JSON.parse(fs.readFileSync(this.cityFile).toString());
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
	    for(var k=0;k<district.regions.length;k++){
		var region = district.regions[k];
		this.task.push({"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin});
	    }
	}
    }
}

Rent.prototype.start = function(){
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(){
    if(this.tasks.length==0){
	console.log("job done.");
	return;
    }
    var t = this.tasks.shift();
    t.pn = 0;
    var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.regionPinyin+"/pn"+t.pn+"/");
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
    $("div.approvebanner table.appbanner_tj tr").each(function(){
	$(this)
    });
    
    $("")
    

    if (data.search("新信息较少，我们为您推荐以下相关信息") != -1) {
        console.log("[DONE] Region: " + args[0]);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 1 + 2) * 1000);
    } else if (data.search('pagerout') != -1 && args[0].pn < 100) {
        data = null;
        args[0].pn++;
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        console.log("[DONE] Region: " + args[0]);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 1 + 2) * 1000);
    }
}

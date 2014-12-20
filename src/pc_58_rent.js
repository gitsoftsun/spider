var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = "58.regions.txt";
    this.resultFile = '58_rent.txt';
    this.pagePerTask = 100;
}

Rent.prototype.init = function(){
    this.cities = JSON.parse(fs.readFileSync(this.dataDir+this.cityFile).toString());
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
<<<<<<< HEAD
	    var city = this.cities[i];
		var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":"全部","regionName":"全部","category":city.cname,"class":'1'};
		this.tasks.push(tmp);
        for(var j=0;j<city.districts.length;j++){
            var district = city.districts[j];
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":"全部","category":district.name,"class":'2'};
            this.tasks.push(tmp);
            if(district.regions.length!=0){
                for(var k=0;k<district.regions.length;k++){
                    var region = district.regions[k];
                    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin,"category":region.name,'class':'3'}
                    this.tasks.push(tmp);
                }
            }
        }
=======
	var city = this.cities[i];
	for(var j=0;j<city.districts.length;j++){
	        var district = city.districts[j];
	        if(district.regions.length==0){
		    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin};
		    this.tasks.push(tmp);
		    //var r = Object.keys(tmp).map(function(k){return tmp[k];}).join('\t');
		    //fs.appendFileSync(this.resultDir+"tasksout.txt",r+'\n');
		        }else{
			    for(var k=0;k<district.regions.length;k++){
				    var region = district.regions[k];
				    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin}
				    this.tasks.push(tmp);
				//var r = Object.keys(tmp).map(function(k){return tmp[k];}).join('\t');
				//    fs.appendFileSync(this.resultDir+"tasksout.txt",r+'\n');
				}
			        }
	    }
>>>>>>> 18c815166a58da90dbe00b9d191181233019be7c
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
	console.log(this.tasks.length);
    }
    if(t.class == '3') {
        var pinyin = t.regionPinyin;
        var name = t.regionName;
        var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+pinyin+"/chuzu/pn"+t.pn+"/");
        console.log("[GET ] %s, %s, %s, %d",t.cityName,t.districtName,name,t.pn);
    } else if(t.class == '2') {
        var pinyin = t.districtPinyin;
        var name = t.districtName;
        var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+pinyin+"/chuzu/");
        console.log("[GET ] %s, %s",t.cityName,t.districtName);
    } else {
        var opt = new helper.basic_options(t.cityPinyin+".58.com","/chuzu/");
        console.log("[GET ] %s",t.cityName);
    }
    opt.agent = false;
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
    	console.log("data empty.");
        if(args[0].class == '1' || args[0].class == '2') {
            console.log("[DONE] Category: " + args[0].category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 2) * 1000);
        } else {
            args[0].pn++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, (Math.random() * 2 + 2) * 1000);
        }
    } else {
        var $ = cheerio.load(data);
        var memberCount = 0;
        var end_flag = 0;
        $("div#infolist > table.tbimg tr").each(function(){
            if($(this).text().indexOf("以上本地信息更新较少") >= 0) {
                end_flag = 1;
                return false;
            }

            var td = $("td.t",this);
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
            var addr = $("p.qj-renaddr",td).text().trim().replace(/[\s]/g,"").replace(/[,，]/g,";");
            var addrInfos = addr.split("/");
            var houseName,pubDate;
            if(addrInfos.length>0)
                houseName = addrInfos[0].trim();
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
            var record = [args[0].cityName,args[0].districtName,args[0].regionName,member,jing,top,name,houseName||"",pubDate||"",jjrName||"",jjcmp||"",jjbranchcmp||"",url,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });

        if(args[0].class == '1' || args[0].class == '2') {
            console.log("[DONE] Category: " + args[0].category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 2) * 1000);
        } else {
            if ($("div#infolist > table.tbimg tr").length<10 || memberCount<4) {
                console.log("[DONE] less info,Category: " + args[0].category);
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
                console.log("[DONE] Category: " + args[0].category);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 2) * 1000);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();

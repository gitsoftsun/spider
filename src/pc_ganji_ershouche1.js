var fs = require('fs')
var http = require('http')
var querystring = require('querystring')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = 'ganji.city.txt';
    this.services = [];
    this.serviceFile = "ganji.ershouche1.txt";
    this.resultFile = 'ganji_ershouche1.txt';
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
        return {"cat_name": vals[0], "cat_ename": vals[1]};
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat_name":service.cat_name,"cat_ename":service.cat_ename};
            this.tasks.push(tmp);
        }
    }

    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    this.resultFile = this.resultFile + '.' + start + '.' + (start + len);
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
    var opt = new helper.basic_options(t.cityPinyin+".ganji.com",t.cat_ename);
    opt.agent = false;
    console.log("[GET ] %s, %s, %d",t.cityName,t.cat_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
        that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data)
        console.log('data empty');
    else {
        t = args[0];
        var $ = cheerio.load(data);
        var memberCount = 0;

        $("div.leftBox div.layoutlist dl.list-pic").each(function(){
            var div = $("div.infor",this);

            var top = $("a em.ico-stick-yellow",div).length;
            var adTop = $("a em.ico-stick-red",div).length;
            var hot = $("span.ico-hot",div).length;
            var pub_date = $("span.gray",div).eq(0).text().replace(/[\n\r,，]/g,";");
            var title = $("a.infor-title",div).text().trim().replace(/[\n\r,，]/g,";");
            var user = $("a.fc-999",div).text().trim().replace(/[\n\r,，]/g,";");
            var url_title = $("a.infor-title",div).attr("href");
            var url_user = $("a.fc-999",div).attr("href");
            var member = $('span.ico-bang-new',this).first().text() || 0;

            if(member)
                memberCount++;
            var record = [t.cityName,t.cat_name,member,hot,top,adTop,pub_date,title,user,url_title,url_user,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });
    }

        console.log("[DONE] Category: " + t.cat_name);
        setTimeout(function () {
            that.wgetList();
        }, (Math.random() * 2 + 2) * 1000);
}

var instance = new Rent();
var that = instance;
that.start();

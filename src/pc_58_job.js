var http = require('http')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
//var cp = require('child_process')
var cheerio = require('cheerio')
function Job() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.industryFile = '58job.json';
    this.indTxtFile = '58job.txt';
    this.ind = null;
    this.host = '58.com';
    this.cmpWorker = null;
    this.lastSendTime = new Date();
    this.cities = [];
    this.cityFile = "58.city.txt";
    this.cateIdx = -1;
    this.resultFile = '58_jobs.txt';
    //this.cmpIdFile = "58cmpId.txt";
}

Job.prototype.init = function () {
    if (!fs.existsSync(this.dataDir + this.industryFile)) {
        console.log('Industry file not found');
        return;
    }
    var str = fs.readFileSync(this.dataDir + this.industryFile).toString();
    this.ind = JSON.parse(str);
    //load cities from file
    this.cities = fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if (!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });
    //str = null;
    /*this.cmpWorker = cp.fork('./pc_58_company.js');
    var that = this;
    this.cmpWorker.on('message', function (msg) {
        if (msg == 'done') {
            console.log('Last page period : ' + ((new Date()) - that.lastSendTime) / 1000 + ' , ' + files.length + " files left.");
            if (files.length > 0) {
                that.processList(files.pop());
            }
        }
    });*/
}

Job.prototype.processList = function (data, args) {
    if (!data) {
        console.log("data empty");
        return;
    }
    if (data.search('对不起...你的访问过于频繁，请输入验证码继续访问') > -1) {
        console.log("ip has been forbidden");
        return;
    }
    console.log("[GOT] %s,%s,%d",args[0].cname,args[1].cl3,args[1].pidx);
    var $ = cheerio.load(data);
    var records = [];
    $('#infolist dl').each(function (i, e) {
        var record = {};
        record.top = $('a.ico.ding1', this).length;
        record.jing = $('a.ico.jingpin', this).length;
        record.cmpName = $('a.fl', this).attr('title');
					    record.cmpName = record.cmpName && record.cmpName.replace(/[,，\r\n]/g,";");
        record.cmpUrl = $('a.fl', this).attr('href');
        record.time = $('dd.w68', this).text();
        //record.fileName = fileName;
        record.name = $('a.t', this).text().replace(/[,，\r\n]/g,';');
        //records.push(record);
        if (!record.name || !record.cmpName) { 
            return true;
        }
        var line = args[0].cname+","+record.name + ',' + record.cmpName + ',' + record.time + ',' + record.jing + ',' + record.top + ',' + record.cmpUrl + '\n';
        fs.appendFileSync(that.resultDir + that.resultFile, line);
    });
    if (data.search("新信息较少，我们为您推荐以下相关信息") != -1) {
        console.log("[DONE] Category: " + args[1].cl3);
        setTimeout(function () {
            that.wgetList(args[0], that.getCate());
        }, (Math.random() * 1 + 2) * 1000);
    } else if (data.search('pagerout') != -1 && args[1].pidx < 100) {
        data = null;
        args[1].pidx++;
        setTimeout(function () {
            that.wgetList(args[0], args[1]);
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        console.log("[DONE] Category: " + args[1].cl3);
        setTimeout(function () {
            that.wgetList(args[0], that.getCate());
        }, (Math.random() * 1 + 2) * 1000);
    }
}

Job.prototype.wgetList = function (city, cate) {
    if (this.cities.length == 0 && cate == null) {
        console.log("[DONE] job done.");
        return;
    }
    if (cate == null) {
        city = this.cities.pop();
        cate = this.getCate(0);
    }
    var host = city.cen + '.' + this.host;
    var curCategory = this.ind[cate.cl1][cate.cl2].cl3[cate.cl3];
    var today = new Date(new Date().getTime()+86400000).toString().replace(/-/g,"");
    var st = new Date(new Date().getTime() - 86400000 * 14).toString().replace(/-/g,"");
    var path = '/' + curCategory 
	+ '/pn' + cate.pidx 
	+ '/?postdate='+st+"_"+today;
    var opt = new helper.basic_options(host, path);
    //console.log(opt);
    console.log("[GET] %s, %s, %d", city.cname,cate.cl3,cate.pidx);
    opt.agent = false;
    helper.request_data(opt, null, function (data, args) {
        that.processList(data,args);
    }, [city,cate]);
}
var arguments = process.argv.splice(2);
var start = arguments[0];
var len = arguments[1];
Job.prototype.getCate = function (idx) {
    if (++this.cateIdx == this.industries.length && idx == undefined) {
        return null;
    }
    if (idx == 0) {
        this.cateIdx = 0;
    }

    var line = this.industries[this.cateIdx].split(',');
    var category = {};
    category.cl1 = line[0];
    category.cl2 = line[1];
    category.cl3 = line[2];
    category.pidx = 1;
    return category;
}
Job.prototype.start = function () {
    //var cities = [{ 'cname': '北京', 'cen': 'bj' }];
    var city = this.cities.pop();
    if (!fs.existsSync(this.dataDir + this.indTxtFile))
        return;
    this.industries = [];
    var inds = fs.readFileSync(this.dataDir + this.indTxtFile).toString().split("\n");
    for (var j = start, c = 0; c < len && j < inds.length; c++, j++) {
        this.industries.push(inds[j]);
    }
    console.log("[INFO] industry count: %d",this.industries.length);
    inds = null;
    var category = this.getCate();
    if (category == null) return;
    this.wgetList(city, category);
//    for(var cl1 in this.ind){
//	for(var cl2 in this.ind[cl1]){
//	    for(var cl3 in this.ind[cl1][cl2].cl3){
//		var category = {};
//		category.cl1=cl1;
//		category.cl2=cl2;
//		category.cl3=cl3;
//		category.pidx=1;
//		str+=category.cl1+','+category.cl2+','+category.cl3+','+this.ind[cl1][cl2].cl3[cl3];
//		this.wgetList(city,category);
//	    }
//	}
    //}
}
Job.prototype.test = function () {
    var c = { 'cname': '北京', 'cen': 'bj' };
    var cate = {};
    cate.cl1 = '生活 | 服务业';
    cate.cl2 = '餐饮';
    cate.cl3 = '服务员';
    cate.pidx = 1;
    this.wgetList(c, cate);
}

var job = new Job();
var that = job;
job.init();
//job.test();
//var files = fs.readdirSync('../result/58job/');
//if (files.length > 0) {
//    job.processList(files.pop());
//}
job.start();

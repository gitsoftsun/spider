//var http = require('http')
//var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
//var dhelper = require('../helpers/domhelper.js')
//var cp = require('child_process')
var cheerio = require('cheerio')
function Job(){
    this.dataDir='../appdata/';
    this.resultDir='../result/';
    this.industryFile = 'ganjijob.json';
    this.ind = null;
    this.host = 'ganji.com';
    this.cmpWorker = null;
    this.cityFile = "ganji.city.txt";
    this.cateIdx = -1;
    this.resultFile = "ganji_jobs.txt";
}

Job.prototype.init=function(){
    if(!fs.existsSync(this.dataDir+this.industryFile)){
	console.log('Industry file not found');
	return ;
    }
    var str = fs.readFileSync(this.dataDir+this.industryFile).toString();
    this.ind = JSON.parse(str);
    str=null;
    
    //load cities from file
    this.cities = fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').filter(function (line, i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if (!line||line=='\r') return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });
    console.log("Cities loaded.");
}

Job.prototype.processList = function (data, args){
    if (!data) {
        console.log("data empty");
        return;
    }
    console.log("[GOT ] %s, %s, %d", args[0].cname, args[1].cl3, args[1].pidx);
	var $=cheerio.load(data);
	var cntNode = $('#list_recommend').prev('div');
	var cntName=cntNode.attr('class');
	if(cntName=='lab-zbd'){
	    console.log('No data on this page');
	    return;
	}
	
	cntNode.find('dl').each(function(){
	    var record={};
	    record.name = $('.list_title',this).text().replace(/[,，\n\r]/g,';');
	    record.hot = $('.ico-hot',this).length;
	    record.top = $('.ico-stick-yellow',this).length;
	    record.adTop = $('.ico-stick-red',this).length;
	    record.cmpName=$('.company a',this).attr('title');
	    record.cmpName = record.cmpName && record.cmpName.replace(/[,，\n\r]/g,';');
	    record.cmpUrl=$('.company a',this).attr('href');
	    record.member=$('span.ico-bang-new',this).first().text();
	    if(!record.member) record.member=0;
            record.time = $('.pub-time', this).text();
        //records.push(record);
        if (!record.name || !record.cmpName) {
            return true;
        }
        var line = args[0].cname + "," + record.name + ',' + record.cmpName + ',' +record.member+','+ record.time + ',' + record.hot + ',' + record.top + ','+ record.adTop+',' + record.cmpUrl + '\n';
        fs.appendFileSync(that.resultDir + that.resultFile, line);
	});
	
    if (data.search('下一页') != -1 && args[1].pidx < 100) {
        data = null;
        args[1].pidx++;
        setTimeout(function () { 
            that.wgetList(args[0], args[1]);
        }, 999);
    } else {
        console.log("[DONE] Category: %s", args[1].cl3);
        setTimeout(function () { 
            that.wgetList(args[0], that.getCate());
        }, 999);
    }
}
/*
 */
Job.prototype.wgetList = function (city,cate){
    if (this.cities.length == 0 && cate == null) {
        console.log("[DONE] job done.");
        return;
    }
    if (cate == null) {
        city = this.cities.pop();
        cate = this.getCate(0);
    }
    /*
    var fileName = cate.cl1+','+cate.cl2+','+cate.cl3+','+city.cname+','+cate.pidx+'.html';
    if(fs.existsSync(this.resultDir+fileName)) {
	console.log(fileName+" already exist.");
	++cate.pidx;
	this.wgetList(city,cate);
	return;
    }*/
    var host=city.cen+'.'+this.host;
//    console.log(cate);
    var curCategory = this.ind[cate.cl1][cate.cl2].cl3[cate.cl3];
    
    var path = '/'+curCategory+'/u3o'+cate.pidx+'/';
    var opt = new helper.basic_options(host,path);
    console.log("[GET ] %s, %s, %d",city.cname,cate.cl3,cate.pidx);
					      helper.request_data(opt,null,function(data,args){
     //   var fileName = args[1].cl1 + ',' 
	    //+ args[1].cl2 + ',' 
	    //+ args[1].cl3 + ',' 
	    //+ args[0].cname + ',' 
	    //+ args[1].pidx + '.html';
	//   fs.writeFileSync(that.resultDir + fileName, data);
     //   console.log("File saved: ", fileName);
	that.processList(data,args);
    },[city,cate]);
}
var arguments = process.argv.splice(2);
var start = arguments[0];
var len = arguments[1];
Job.prototype.getCate = function (idx){
    if (++this.cateIdx == this.industries.length && idx == undefined) { 
        return null;
    }
    if (idx == 0) { 
        this.cateIdx = 0;
    }
    var line = this.industries[this.cateIdx].split(',');
    var category = {};
    category.cl1=line[0];
    category.cl2=line[1];
    category.cl3=line[2];
    category.pidx=1;
    return category;
}
Job.prototype.start = function(){
    //var cities=[{'cname':'北京','cen':'bj'}];
    var city = this.cities.pop();
    if(!fs.existsSync(this.dataDir+"ganjijob.txt"))
	return;
    this.industries = [];
    var inds = fs.readFileSync(this.dataDir+"ganjijob.txt").toString().split("\n");
    for(var j=start,c=0;c<len&&j<inds.length;c++,j++){
	if(!inds[j]) continue;
	this.industries.push(inds[j]);
    }
    inds=null;
    var category = this.getCate();
    if(category==null) return;
    this.wgetList(city,category);
/*    for(var cl1 in this.ind){
	for(var cl2 in this.ind[cl1]){
	    for(var cl3 in this.ind[cl1][cl2].cl3){
		var category = {};
		category.cl1=cl1;
		category.cl2=cl2;
		category.cl3=cl3;
		category.pidx=1;
		console.log(category.cl1+','+category.cl2+','+category.cl3+','+this.ind[cl1][cl2].cl3[cl3]);
//		this.wgetList(city,category);
	    }
	}
    }*/
}
Job.prototype.test=function(){
    var c = {'cname':'北京','cen':'bj'};
    var cate = {};
    cate.cl1='销售|客服|人力|行政';
    cate.cl2='销售';
    cate.cl3='电话销售';
    cate.pidx=1;
    this.wgetList(c,cate);
}

var job = new Job();
var that = job;
job.init();
job.start();
//job.test();
//job.processList("技工|生产|物流,技工|工人,搬运工,北京,1.html");

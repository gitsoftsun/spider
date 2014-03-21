var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var dhelper = require('../helpers/domhelper.js')
var cp = require('child_process')
var cheerio = require('cheerio')
function Job(){
    this.dataDir='../appdata/';
    this.resultDir='../result/ganjijob/';
    this.industryFile = 'ganjijob.json';
    this.ind = null;
    this.host = 'ganji.com';
    this.cmpWorker = null;
}

Job.prototype.init=function(){
    if(!fs.existsSync(this.dataDir+this.industryFile)){
	console.log('Industry file not found');
	return ;
    }
    var str = fs.readFileSync(this.dataDir+this.industryFile).toString();
    this.ind = JSON.parse(str);
    str=null;
//    this.cmpWorker = cp.fork('./pc_ganji_company.js');
}

Job.prototype.processList=function(fileName){
    if(!fs.existsSync(this.resultDir+fileName)){
	console.log('File not found: ' + fileName);
	return;
    }
//    var worker = this.cmpWorker;
    fs.readFile(this.resultDir+fileName,function(err,data){
	if(err){
	    console.log('Read file error: '+err.message);
	    return;
	}
	var $=cheerio.load(data);
	var cntNode = $('#list_recommend').prev('div');
	var cntName=cntNode.attr('class');
	if(cntName=='lab-zbd'){
	    console.log('No data on this page');
	    return;
	}
	var records = [];
	cntNode.find('dl').each(function(){
	    var record={};
	    record.name = $('.list_title',this).text().replace(/,/g,' ');
	    record.hot = $('.ico-hot',this).length==1?"是":"否";
	    record.top = $('.ico-stick-yellow',this).length==1?"是":"否";
	    record.adTop = $('.ico-stick-red',this).length==1?"是":"否";
	    record.cmpName=$('.company a',this).attr('title');
	    record.cmpUrl=$('.company a',this).attr('href');
	    record.member=$('span.ico-bang-new',this).first().text();
	    if(!record.member) record.member="否";
	    record.time = $('.pub-time',this).text();
	    record.fileName=fileName;
	    records.push(record);
	});
	
	cp.fork('./pc_ganji_company.js').send(records);
	records=null;
    });
}
/*
 */
Job.prototype.wgetList=function(city,cate){
    var fileName = cate.cl1+','+cate.cl2+','+cate.cl3+','+city.cname+','+cate.pidx+'.html';
    if(fs.existsSync(this.resultDir+fileName)) {
	console.log(fileName+" already exist.");
	++cate.pidx;
	this.wgetList(city,cate);
	return;
    }
    var host=city.cen+'.'+this.host;
//    console.log(cate);
    var curCategory = this.ind[cate.cl1][cate.cl2].cl3[cate.cl3];
    
    var path = '/'+curCategory+'/u1o'+cate.pidx+'/';

    var opt = new helper.basic_options(host,path);
    console.log("GET ",host+path);
    var that = this;
    helper.request_data(opt,null,function(data,args){
	var fileName = args[1].cl1+','
	    +args[1].cl2+','
	    +args[1].cl3+','
	    +args[0].cname+','
	    +args[1].pidx+'.html';
	fs.writeFileSync(that.resultDir+fileName,data);
	console.log("File saved: ",fileName);
	that.processList(fileName);

	if(data.search('下一页')!=-1&&args[1].pidx<100){
	    data=null;
	    args[1].pidx++;
	    that.wgetList(args[0],args[1]);
	}else{
	    console.log("Category done: "+cate.cl3);
	    var c = that.getCate();
	    if(!c) return;
	    that.wgetList(args[0],c);
	}
    },[city,cate]);
}
var arguments = process.argv.splice(2);
var start = arguments[0];
var len = arguments[1];
Job.prototype.getCate=function(){
    if(this.industries.length==0) return null;
    var line = this.industries.pop().split(',');
    var category = {};
    category.cl1=line[0];
    category.cl2=line[1];
    category.cl3=line[2];
    category.pidx=1;
    return category;
}
Job.prototype.start = function(){
    var cities=[{'cname':'北京','cen':'bj'}];
    var city = cities.pop();
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
job.init();
job.start();
//job.test();
//job.processList("技工|生产|物流,技工|工人,搬运工,北京,1.html");

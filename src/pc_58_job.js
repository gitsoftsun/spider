var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cp = require('child_process')
var cheerio = require('cheerio')
function Job(){
    this.dataDir='../appdata/';
    this.resultDir='../result/58job/';
    this.industryFile = '58job.json';
    this.indTxtFile = '58job.txt';
    this.ind = null;
    this.host = '58.com';
    this.cmpWorker = null;
    this.lastSendTime=new Date();
}

Job.prototype.init=function(){
    if(!fs.existsSync(this.dataDir+this.industryFile)){
	console.log('Industry file not found');
	return ;
    }
    var str = fs.readFileSync(this.dataDir+this.industryFile).toString();
    this.ind = JSON.parse(str);
    str=null;
    this.cmpWorker = cp.fork('./pc_58_company.js');
    var that = this;
    this.cmpWorker.on('message',function(msg){
	if(msg=='done'){
	    console.log('Last page period : '+((new Date())-that.lastSendTime)/1000+' , '+files.length+" files left.");
	    if(files.length>0){
		that.processList(files.pop());
	    }
	}
    });
}

Job.prototype.processList=function(fileName){
    if(!fs.existsSync(this.resultDir+fileName)){
	console.log('File not found: ' + fileName);
	return;
    }
    var that = this;
    fs.readFile(this.resultDir+fileName,function(err,data){
	if(err){
	    console.log('Read file error: '+err.message);
	    return;
	}
	
	var $ = cheerio.load(data);
	var records = [];
	$('#infolist dl').each(function(i,e){
	    var record={};
	    record.top=$('a.ico ding1',this).length==1?"是":"否";
	    record.jing=$('a.ico jingpin',this).length==1?"是":"否";
	    record.cmpName=$('a.fl',this).attr('title');
	    record.cmpUrl = $('a.fl',this).attr('href');
	    record.time = $('dd.w68',this).text();
	    record.fileName = fileName;
	    record.name=$('a.t',this).text();
	    records.push(record);
	});
//	cp.fork('./pc_58_company.js').send(records);
	that.cmpWorker.send(records);
	this.lastSendTime=new Date();
	records=null;
    });
}
/*
 */
Job.prototype.wgetList=function(city,cate){
    if(cate==null) return;
    var fileName = cate.cl1+','
	+cate.cl2+','
	+cate.cl3+','
	+city.cname+','
	+cate.pidx+'.html';
    if(fs.existsSync(this.resultDir+fileName)){
	console.log(fileName+" already exist.");
	++cate.pidx;
	this.wgetList(city,cate);
	return;
    }
    var host=city.cen+'.'+this.host;
    var curCategory = this.ind[cate.cl1][cate.cl2].cl3[cate.cl3];
    
    var path = '/'+curCategory
	+'/pn'+cate.pidx
	+'/?postdate=2014031800_2014032100';
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
	if(data.search('pagerout')!=-1&&args[1].pidx<100){
	    data=null;
	    args[1].pidx++;
	    setTimeout(function(){
		that.wgetList(args[0],args[1]);
	    },(Math.random()*10+1)*1000);
	}else{
	    console.log("Category done: "+cate.cl3);
	    that.wgetList(args[0],that.getCate());
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
    if(!fs.existsSync(this.dataDir+this.indTxtFile))
	return;
    this.industries=[];
    var inds = fs.readFileSync(this.dataDir+this.indTxtFile).toString().split("\n");
    for(var j=start,c=0;c<len&&j<inds.length;c++,j++){
	this.industries.push(inds[j]);
    }
    inds=null;
    var category = this.getCate();
    if(category==null) return;
    this.wgetList(city,category);
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
Job.prototype.test=function(){
    var c = {'cname':'北京','cen':'bj'};
    var cate = {};
    cate.cl1='生活 | 服务业';
    cate.cl2='餐饮';
    cate.cl3='服务员';
    cate.pidx=1;
    this.wgetList(c,cate);
}

var job = new Job();
job.init();
//job.test();
var files = fs.readdirSync('../result/58job/');
if(files.length>0){
    job.processList(files.pop());
}
//job.start();
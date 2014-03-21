var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var jsdom = require('jsdom').jsdom
var cp = require('child_process')
function Job(){
    this.dataDir='../appdata/';
    this.resultDir='../result/58job/';
    this.industryFile = '58job.json';
    this.indTxtFile = '58job.txt';
    this.ind = null;
    this.host = '58.com';
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
//    this.cmpWorker = cp.fork('./pc_58_company.js');
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
	var doc = jsdom(data);
	console.log("document loaded");
	//set to null to tell gc to collect
	data = null;
	var document = doc.parentWindow.document;
	var infoContainer = document.getElementById('infolist');
	if(!infoContainer){
	    console.log('No avaliable content in page');
	    return;
	}
	var items = infoContainer.getElementsByTagName('dl');
	var records = [];
	for(var i=0;i<items.length;i++){
	    var record={};
	    var ch = items[i].children;
	    var nameEles = ch[1].children;
	    record.name = nameEles[0].innerHTML.trim();
	    var lastEleCls = nameEles[nameEles.length-1].className;
	    record.jing = '否';
	    record.top = '否';
	    if(lastEleCls=='ico ding1'){
		record.top='是';
	    }
	    if(lastEleCls=='ico jingpin'){
		//cannot get company url in current page.
		record.jing = '是';
	    }
	    record.cmpName = ch[2].children[0].title;
	    record.time = ch[4].innerHTML;
	    record.cmpUrl = ch[2].children[0].href;
	    record.fileName=fileName;
	    records.push(record);
	}
	console.log(records.length);
	doc=null;
//	worker.send(records);
//	cp.fork('./pc_58_company.js').send(records);
	records=null;
    });
}
/*
 */
Job.prototype.wgetList=function(city,cate){
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
//	that.processList(fileName);
	if(data.search('pagerout')!=-1&&args[1].pidx<100){
	    data=null;
	    args[1].pidx++;
	    setTimeout(function(){
		that.wgetList(args[0],args[1]);
	    },(Math.random()*10+1)*1000);
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
//job.processList("生活 | 服务业,餐饮,后厨,北京,3.html");
job.start();
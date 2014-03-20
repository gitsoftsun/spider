var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var dhelper = require('../helpers/domhelper.js')
var jsdom = require('jsdom').jsdom
var cp = require('child_process')
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
	var doc = jsdom(data);
	//set to null to tell gc to collect
	data = null;
	var document = doc.parentWindow.document;
	var recommend = document.getElementById('list_recommend');
	if(!recommend){
	    console.log('No avaliable content in page');
	    return;
	}
	var listContainer = dhelper.getPrevElementSibling(recommend);
	
	if(listContainer.className=='lab-zbd'){
	    console.log('No data on this page');
	    return;
	}
	var items = listContainer.getElementsByTagName('dl');
	var records = [];
	for(var i=0;i<items.length;i++){
	    var record={};
	    var titLink = items[i].getElementsByClassName("list_title")[0];
	    if(titLink){
		record.name=titLink.innerHTMl;
	    }
	    var sBox = items[i].getElementsByClassName("s-box")[0];
	    var typeEle = dhelper.getNextElementSibling(sBox);
	    record.hot = "否";
	    record.top = "否";
	    record.adTop = "否";
	    if(typeEle&&typeEle.tagName=='SPAN'&&typeEle.className=="ico-hot"){
		record.hot="是";
	    }else if(typeEle&&typeEle.tagName=="A"){
		if(typeEle.children[0]&&typeEle.children[0].className=="ico-stick-yellow"){
		    record.top = "是";
		}else if(typeEle.children[0]&&typeEle.children[0].className=="ico-stick-red"){
		    record.adTop = "是";
		}
	    }
	    var cmpEle = items[i].getElementsByClassName("company")[0];
	    if(cmpEle){
		var cmpLink = cmpEle.getElementsByTagName("a")[0];
		if(cmpLink){
		    record.cmpName = cmpLink.title;
		    record.cmpUrl = cmpLink.href;
		}
		var bangIco = cmpEle.getElementsByClassName("ico-bang-new")[0];
		if(bangIco){
		    record.member = bangIco.innerHTML;
		}else{
		    record.member = "否";
		}
	    }
	    var timeEle = items[i].getElementsByClassName("pub-time")[0];
	    if(timeEle){
		record.time = timeEle.innerHTML;
	    }
	    record.fileName=fileName;
	    records.push(record);
	}
	doc=null;
	cp.fork('./pc_ganji_company.js').send(records);
//	console.log(records);
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
	    that.wgetList(args[0],that.getCate());
	}
    },[city,cate]);
}
var arguments = process.argv.splice(2);
var start = arguments[0];
var len = arguments[1];
Job.prototype.getCate=function(){
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
    var inds = fs.readFileSync(this.dataDir+"ganjijob.txt").toString().split("\r\n");
    for(var j=start;j<len;j++){
	this.industries.push(inds[j]);
    }
    var category = this.getCate();
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
//job.processList("销售|客服|人力|行政,销售,电话销售,北京,1.html");

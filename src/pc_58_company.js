var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var jsdom = require('jsdom').jsdom
var cheerio = require('cheerio')
function Company(){
    console.log('Company worker starting');
    this.doneCount=0;
    this.todoCount=0;
    this.failedCount=0;
    this.pretodoCount=0;
    this.predoneCount=0;
    this.company={};
    this.cmpDir="../result/58company/";
    this.resultDir="../result/";
    this.records=[];
    this.preRecords=[];
    this.cmpHost="http://qy.58.com";
    this.originalFile = "58.original.txt";
    this.companyFile = "58.company.txt";
}
/*
{ name: '酒店诚聘男女服务员包食宿',
  jing: '否',
  top: '否',
  cmpName: '北京酷乐嘉华休闲健身娱乐有限公司',
  time: '今天',
  cmpUrl: 'http://qy.58.com/15278344077830/',
  fileName: '生活 | 服务业,餐饮,服务员,北京,1.html'
};
*/
Company.prototype.init=function(){
    var that = this;
    if(fs.existsSync(this.resultDir+this.companyFile)){
	fs.readFileSync(this.resultDir+this.companyFile).toString().split('\r\n').forEach(function(line){
	    if(!line) return;
	    var vals = line.split(',');
	    that.company[vals[0]] = {cmpId:vals[0],cmpName:vals[1],member:vals[2],ind:vals[3],site:vals[4]};
	});
    }
    
    process.on('message',function(msg){
	that.records=msg;
	that.preProcess();
    });
}
Company.prototype.preProcess=function(){
    this.todoCount = this.records.length;
    var that = this;
    this.records.forEach(function(e){
	if(e.jing=='是'){
	    that.preRecords.push(e);
	}
    });
    this.pretodoCount = this.preRecords.length;
    console.log(this.pretodoCount+" of "+this.todoCount+" item need preprocess");
    
//    for(var i =0;i<this.records.length;i++){
    if(this.preRecords.length>0){
	var r = this.preRecords.pop();
	helper.request_data(r.cmpUrl,null,function(data,args){
	    that.filterCmpUrl(data,args);
	},r);
    }else{
	this.onPreProcessed();
    }
}
Company.prototype.filterCmpUrl=function(data,args){
    console.log('Preprocessing '
		+(this.predoneCount+1)
		+' of '
		+this.pretodoCount
	       );
    var $=cheerio.load(data);
    args[0].cmpUrl = $('div.company a').attr('href');
    this.predoneCount++;
    if(this.pretodoCount==this.predoneCount){
	this.onPreProcessed();
    }
    if(this.preRecords.length==0) return;
    var r = this.preRecords.pop();
    var that = this;
    helper.request_data(r.cmpUrl,null,function(data,args){
	that.filterCmpUrl(data,args);
    },r);
}
Company.prototype.onPreProcessed=function(){
    console.log('Preprocess done.');    
    this.wget();
}
Company.prototype.wget=function(){
    if(this.records.length==0) return;
    var r = null;
    while(this.records.length>0){
	var r=this.records.pop();
	console.log("Start ",r.cmpUrl);
	var m = r.cmpUrl.match(/\/(\d+)\//);
	if(m){
	    r.cmpId = m[1];
	    if(this.company[r.cmpId]){
		console.log("Company exists");
		r.cmpUrl = this.company[r.cmpId].cmpUrl;
		r.member = this.company[r.cmpId].member;
		r.ind = this.company[r.cmpId].ind;
		r.site = this.company[r.cmpId].site;
		this.save(r);
		r=null;
	    }
	    else{
		r.cmpUrl = this.cmpHost+"/"+r.cmpId+"/";
		break;
	    }
	}
    }
    if(r==null) return;
    var that = this;
    console.log('GET '+r.cmpUrl);
    helper.request_data(r.cmpUrl,null,function(data,args){
	that.process(data,args);
	that.wget();
    },r);
}
Company.prototype.process = function(data,args){
    console.log("Processing "+args[0].cmpName);
    //fs.writeFileSync(this.cmpDir+args[0].cmpId+".html",data);
    var $ = cheerio.load(data);
    $('.basicMsg table').each(function(){
	var member = $('.yearIco i',this).text();
	args[0].member = member?member:"否";
	args[0].ind=$('.c33',this).text();
	args[0].site=args[0].cmpUrl;
    });
    this.save(args[0]);
/*    var doc = jsdom(data);
    var document = doc.parentWindow.document;
    var container = document.getElementsByClassName('basicMsg')[0];
    if(!container){
	console.log('Page unavaliable: ',args[0]);
	this.failedCount++;
	return;
    }
    var table = container.getElementsByTagName('table')[0];
    if(table){
	var trs = table.getElementsByTagName('tr');
	var memberEle = trs[0].getElementsByClassName("yearIco")[0];
	if(memberEle){
	    args[0].member = memberEle.children[0].innerHTML;
	}else{
	    args[0].member = '否';
	}
	var ind = trs[1].getElementsByClassName("c33")[0];
	if(ind){
	    args[0].ind = ind.innerHTML;
	}
	var site = trs[3].getElementsByTagName("a")[0];
	if(site){
	    args[0].site = site.innerHTML;
	}

	this.save(args[0]);
    }
    doc=null;
    document=null;
    data=null;*/
}
Company.prototype.save=function(r){
    var sb = new helper.StringBuffer();
    sb.append(r.fileName.replace(/,\d+\.html/,''));
    sb.append(',');
    sb.append(r.name);
    sb.append(',');
    sb.append(r.cmpName);
    sb.append(',');
    sb.append(r.cmpId);
    sb.append(',');
    sb.append(r.time);
    sb.append(',');
    sb.append(r.jing);
    sb.append(',');
    sb.append(r.top);
    sb.append(',');
    sb.append(r.member);
    sb.append(',');
    sb.append(r.ind);
    sb.append(',');
    sb.append(r.site);
    sb.append('\r\n');

    fs.appendFileSync(this.resultDir+this.originalFile,sb.toString());
    
    sb.clear();
    if(!this.company[r.cmpId])
    {
	sb.append(r.cmpId);
	sb.append(',');
	sb.append(r.cmpName);
	sb.append(',');
	sb.append(r.member);
	sb.append(',');
	sb.append(r.ind);
	sb.append(',');
	sb.append(r.site);
	sb.append('\r\n');
	fs.appendFileSync(this.resultDir+this.companyFile,sb.toString());
	sb.clear();
	sb=null;
    }
    
    this.doneCount++;
    if(this.doneCount+this.failedCount==this.todoCount)
	this.onCompleted();
}
Company.prototype.onCompleted=function(){
    console.log("Worker done, exit");
//    process.disconnect();
    process.exit();
}

var worker = new Company();
worker.init();

var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')

var Dealer = function(){
    this.resultDir = "../../result/";
    this.dataDir = '../../appdata/';
    this.resultFile = "athmdealer.txt";
    this.processFile = "athmdealer_process.txt";
    this.done = {};
    this.curPageIdx = 1;
}
//http://deal.autohome.com.cn/china/?k=2, 综合经销商

Dealer.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.processFile)){
	this.curPageIdx = Math.max.apply(null,fs.readFileSync(this.resultDir+this.processFile).toString().split('\n'))+1;
    }
    console.log("[INFO] Last page index: %d",this.curPageIdx);
}

Dealer.prototype.start = function(){
    this.init();
    this.wgetList();
}

Dealer.prototype.wgetList = function(){
    var host = "dealer.autohome.com.cn";
    var path = "/china/";
    if(this.curPageIdx>1){
	path += "0_0_0_0_"+this.curPageIdx+".html";
    }
    var opt = new helper.basic_options(host,path);
    opt.agent = false;
    console.log("[GET ] %s",this.curPageIdx);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    });
}

Dealer.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	setTimeout(function(){
	    that.wgetList();
	},3000);
	return;
    }
    var $ = cheerio.load(data);
    var records = [""];
    $("div.dealer-cont").each(function(){
	var titleLink = $("h3.dealer-cont-title a",this).last();
	var name = titleLink.text();
	name = name && name.replace(/[,，]/g,"");
	var brand = $(titleLink).attr("js-dbrand");
	var sName = $(titleLink).attr("js-dname");
	var city = $(titleLink).attr('js-darea');
	var phone = $("span.dealer-api-phone",this).text()|| "无";
	records.push([name,sName,brand,city,phone].join());
    });
    
    fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    fs.appendFileSync(this.resultDir+this.processFile,this.curPageIdx+"\n");
    var nextPage = $("div.page a").last();
    var nextPageClass = nextPage && nextPage.attr('class');
    if(nextPageClass && nextPageClass.indexOf("page-disabled")>-1){
	//no more pages.
	console.log("[DONE]job done");
	return;
    }else{
	this.curPageIdx++;
    }
    this.wgetList();
}

var instance = new Dealer();
var that = instance;
instance.start();
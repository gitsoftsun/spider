var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var url = require('url')

var Dealer = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "athmec_"+new Date().toString()+".txt";
    this.progressFile = "athmec_progress_"+new Date().toString()+".txt";
    this.done = {};
    this.curPageIdx = 1;
    this.cities = [];
}
//http://deal.autohome.com.cn/china/?k=2, 综合经销商

Dealer.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.progressFile)){
	fs.readFileSync(this.resultDir+this.progressFile).toString().split('\n').reduce(function(pre,cur){
	    if(cur){
		pre[cur]=true;
	    }
	    return pre;
	},this.done);
    }
    this.getCity();
}

Dealer.prototype.getCity = function(){
    var opt = new helper.basic_options("mall.autohome.com.cn","/home/changecity");
    helper.request_data(opt,null,function(data,args,res){
	if(!data){
	    console.log("[ERROR] error while getting city list.");
	    setTimeout(function(){
		that.getCity();
	    },20000);
	    return;
	}
	var $ = cheerio.load(data);
	$(".city-main-list a.point").each(function(){
	    var path = $(this).attr("href");
	    var name = $(this).text().trim();
	    that.cities.push({"name":name,"path":path});
	});
	console.log("[INFO] city count:%d",that.cities.length);
	that.wgetList();
    });
}

Dealer.prototype.start = function(){
    this.init();
    //this.wgetList();
}

Dealer.prototype.wgetList = function(){
    var host = "mall.autohome.com.cn";
    var path = "/home/changecity";
    var c = null;
    do{
	c = this.cities.shift();
    }
    while(c&&this.done[c.name] && this.cities.length);
    if(!c){
	console.log("[DONE] job done.");
	return;
    }
    var q = url.parse("http://mall.autohome.com.cn"+c.path,true).query;
    var opt = new helper.basic_options(host,path,'GET',false,false,q);
    opt.agent = false;
    console.log("[GET ] %s",c.name);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },c);
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
    $("ul.card-list li.card a").each(function(){
	var name = $("h2",this).text().trim();
	name = name && name.replace(/\s/g,'');
	var price = $("strong.promotion-bigcard-price",this).text().trim();
	if(!price)
	    return;
	
	var delta = $("strong.promotion-bigcard-info",this).text().trim();
	var matches = $("p.promotion-bigcard-leftnumber",this).eq(0).text().match(/\d+/);
	var leftCount = matches && matches[0];
	var leftTime = $("label.mallTimer",this).attr("data-seconds");
	var started = true;
	if(!leftTime){
	    leftTime = $("p.promotion-bigcard-lefttime label",this).text();
	    started = false;
	}
	var promo = $("div.promotion-bigcard-footer",this).text().trim();
	promo = promo && promo.replace(/[\s]/g,'');
	var record = [args[0].name,name,price,delta,leftCount,leftTime,promo,started?"Y":"N"].join('\t');
	console.log(record);
	records.push(record);
    });
    
    fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    //fs.appendFileSync(this.resultDir+this.progressFile,this.curPageIdx+"\n");
    //var nextPage = $("div.page a").last();
    //var nextPageClass = nextPage && nextPage.attr('class');
    //if(nextPageClass && nextPageClass.indexOf("page-disabled")>-1){
	//no more pages.
        //console.log("[DONE]job done");
	//return;
    //}else{
//	this.curPageIdx++;
//    }
    this.wgetList();
}

var instance = new Dealer();
var that = instance;
instance.start();
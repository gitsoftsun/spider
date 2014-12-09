var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var http = require("http");
var qs = require("querystring");
var Mall = function(){
    this.resultDir = "../../result/";
    this.dataDir = '../../appdata/';
    this.resultFile = "yichemall_"+new Date().toString()+".txt";
    this.resultItemsFile = "yichemall_items_"+new Date().toString()+".txt";
    this.processFile = "yichemall_progress.txt";
    this.done = {};
    this.curPageIdx = 1;
    this.tasks = [];
    this.items = null;
    this.doneCount = 0;
}

Mall.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.processFile)){
	//this.curPageIdx = fs.readFileSync(this.resultDir+this.processFile).toString().split('\n');
    }
    //console.log("[INFO] Last page index: %d",this.curPageIdx);
}

Mall.prototype.start = function(){
    this.init();
    var arguments = process.argv.splice(2);
    if(arguments[0]=="fromfile"){
	this.wgetDetail();
    }else{
	this.getMaxPage(this.wgetList);
    }
}

Mall.prototype.getMaxPage = function(fn){
    var host = "www.yichemall.com";
    var path = "/car/list";
    
    var opt = new helper.basic_options(host,path);
    opt.agent = false;
    console.log("[GET ] max page idx...");/*
    helper.request_data(opt,null,function(data,args,res){
	if(!data){
	    console.log("[ERROR] data empty.");
	    return;
	}
	var $ = cheerio.load(data);
	that.maxPage = Number($(".pagin a").last().text());

	console.log("[DATA] max page: %d",that.maxPage);
	
    });*/
    this.maxPage = 12;
    for(var i=1;i<=that.maxPage;i++){
	fn.call(that,i);
    }
}

Mall.prototype.wgetList = function(p){
    var host = "www.yichemall.com";
    var path = "/car/list";
    
    var opt = new helper.basic_options(host,path,"GET",false,false,{"p":p});
    opt.agent = myAgent;
    console.log("[GET ] page: %d",p);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },p);
}

Mall.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	setTimeout(function(){
	    that.wgetList(args[0]);
	},3000);
	return;
    }
    console.log("[DATA] page: %d",args[0]);
    
    var $ = cheerio.load(data);
    $(".list_page ul.pro_main li.mod div.mod-wrap > a").each(function(){
	that.tasks.push($(this).attr("href"));
    });
    this.maxPage--;
    console.log(this.tasks.length);
    if(this.maxPage==0){
	console.log("[DONE] %d items got.",this.tasks.length);
	setTimeout(function(){
	    that.listEnd();
	});
    }
}
var myAgent = new http.Agent();
myAgent.maxSockets = 10000;
Mall.prototype.listEnd = function(){
    this.tasks.map(function(path){
	if(path){
	    return path.match(/\d+/)[0];
	}
    }).forEach(function(id){
	var q=qs.stringify({"modelId": id});
	var opt = new helper.basic_options("www.yichemall.com","/SingleProduct/GetProductList","POST",false,true,q);
	opt.agent = false;//myAgent;
	
	helper.request_data(opt,q,function(data,args){
	    data.Product.forEach(function(item){
		var path = '/car/detail/c_' + item.CarId + '_' + item.CarName;
		fs.appendFileSync(that.resultDir+that.resultItemsFile,path+'\n');
	    });
	    that.tasks.pop();
	    if(that.tasks.length==0){
		that.wgetDetail();
	    }
	});
    });
}

Mall.prototype.wgetDetail = function(t){
    if(this.items==null){
	this.items=fs.readFileSync(this.resultDir+this.resultItemsFile).toString().split('\n');
	console.log("[INFO] total items: %d",this.items);
    }
    if(!t){
	var t = null;
	do{
	    t = this.items.shift();
	}
	while(this.items.length>0 && !t);
	
	if(!t){
	    console.log("[DONE] job done.");
	    return;
	}
    }
    
    var opt = new helper.basic_options("www.yichemall.com",t);
    opt.agent = myAgent;
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },t);

}

Mall.prototype.processDetail = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	this.wgetDetail();
	return;
    }
    var $ = cheerio.load(data);
    var title = $("h2").attr("title");
    var words = title && title.split(/\s+/);
    var brand,model;
    if(words && words.length>0)
	brand = words[0];
    if(words && words.length>1)
	model = words[1];
    
    var config = $("#ProductName").val();
    var sale = $("strong#jinrong0").text().trim();
    sale = sale && sale.replace(/\s*/g,'');
    var mallPrice = $("#MallPrice").text().trim();
    mallPrice = mallPrice && mallPrice.replace(/\s*/g,'');
    var factoryPrice = $("#FactoryPrice").text().trim();
    factoryPrice = factoryPrice && factoryPrice.replace(/\s*/g,'');
    var city = $("#currentCity").text().trim();
    
    var r = [args[0],brand,model,config,sale,mallPrice,factoryPrice,city].join("\t");
    fs.appendFileSync(this.resultDir+this.resultFile,r+'\n');
    this.doneCount++;
    console.log(this.doneCount);
    this.wgetDetail();
}

var instance = new Mall();
var that = instance;
instance.start();
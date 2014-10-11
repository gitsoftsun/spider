var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')

function DD(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "dd.txt";
    this.cityFile = "dd_city.txt";
    //this.categoryFile = "place_categories.txt";
    this.cities = [];
    
    //this.categories = [];
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
    //could use pagination query parameters directly.
    this.query = function(cateId,cateName,cateCode,cityName,cityCode,pageIdx){
	//this.categoryId=296;
	this.categoryId=cateId
	this.what=cateName;//"Ng%C3%A2n+h%C3%A0ng"
	this.whatUrl=cateCode;//"ngan-hang-c296"
	this.where=cityName;//"H%C3%A0+N%E1%BB%99i"
	this.whereUrl=cityCode;//"ha-noi"
	this.page=pageIdx || 1;
	this.sort = "";
    }
}

DD.prototype.init = function(){
    var doneCount = 0;

    var args = process.argv.slice(2);
    if(args.length>0){
	this.startIdx = args[0];
    }
    if(args.length>1){
	this.count = args[1];
    }
    
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {enname:vals[0],code:vals[1],name:vals[2]};
    });
    /*this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {code:vals[1],id:vals[2],enname:vals[0],name:vals[3]};
    });*/
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	console.log("[DONE COUNT] %d",doneCount);
	return;
    }
    fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').map(function(line){
	if(line){
	    return line.split(',')[2];
	}
	return "";
    }).reduce(function(pre,cur){
	pre[cur]=true;
	++doneCount;
	return pre;
    },this.doneItems);
    //console.log(this.doneItems);
    console.log("[DONE COUNT] %d",doneCount);
    console.log("[CITIES] %d",this.cities.length);
    //console.log("[CATEGORIES] %d",this.categories.length);
}

DD.prototype.start = function(){
    this.init();
    for(var i=0;i<this.cities.length;i++){
	if(this.cities[i])
	    this.taskQueue.push({city:this.cities[i]});
    }
    this.startIdx = Number(this.startIdx) || 0;
    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    /*
    http.get("http://www.place.vn/",function(res){
	var key = "Set-Cookie";
	console.log(res[key]);
	if(res[key]){
	    var cookies = res[key].split(";");
	    that.cookie = cookies[0];
	}

    });*/
    that.wgetList();
}
DD.prototype.wgetList = function(t){
    if(!t){
	t = this.taskQueue.shift();
	t.pageIdx = 1;
	t.shopCount=-1;
	t.reviews = 0;
	t.shops = [];
	t.photoCount = 0;
    }
    var q = new this.query("",t.pageIdx);//I don't know the query parameters for pool network
    var opt = new helper.basic_options('diadiemanuong.com/',"/",'POST',false,true,q);//path of url the same to query parameters.
    console.log(opt);
    console.log("[GET] %s: %d",t.city.enname,t.pageIdx);
    helper.request_data(opt,q,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

DD.prototype.processList = function(data,args,res){
    if(res.statusCode==403){
	console.log("IP has been forbidden");
	return;
    }
    if(!data){
	console.log("data empty");
	this.wgetList();
	return;
    }
    
    var $ = cheerio.load(data);
    var itemSelector;
    itemSelector = "";//shop item selector
    $(itemSelector).each(function(){
	var shop = {};
	//TODO: parse elements to shop.
	args[0].shops.push(shop);
    });
    console.log("[DATA] %s, %d",args[0].city.enname,args[0].pageIdx);
    this.wgetDetail(args[0]);
}

DD.prototype.wgetDetail = function(task){
    if(task.shops.length==0){
	++task.pageIdx;
	this.wgetList(task);
	return;
    }
    
    var shop = task.shops.shift();
    var opt = new helper.basic_options("diadiemanuong.com",shop.path);
    console.log("[GET] %s",shop.name);
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },[task,shop]);
}

DD.prototype.processDetail = function(data,args){
    if(!data){
	console.log("detail data empty.");
    }
    var $ = cheerio.load(data);
    //TODO: photoCount and category info.
    //photoCount is on the bubble of top right.
    //category is on the right of the map which tag color is yellow.
    
    var record = [args[0].city.enname,args[1].cateogry,args[1].path,args[1].star,args[1].reviews,args[1].photoCount,'\n'].join();
    fs.appendFileSync(this.resultDir+this.resultFile,record);
    console.log("[DONE] %s",record);
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },1000);
}

var instance = new DD();
var that = instance;
instance.start();

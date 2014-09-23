var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var entity = require('../../models/entity.js')

function Yelp(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "yelp.txt";
    this.doneFile = "yelp_done_item.txt";
    this.cityFile = "yelp_city.txt";
    this.categoryFile = "yelp_categories.txt";
    this.cities = [];
    
    this.searchQuery = function(city,category,startIdx){
	this.find_loc = encodeURIComponent(city);
	this.cflt = category;
	this.start = startIdx==undefined?0:startIdx;
    }
    this.categories = ['active','arts','auto'];
    this.taskQueue = [];
}

Yelp.prototype.init = function(){
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n');
    this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n');
}

Yelp.prototype.start = function(){
//    this.load();
    this.init();
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.categories.length;j++){
	    this.taskQueue.push({city:this.cities[i],cate:this.categories[j]});
	}
    }
    console.log("%d task todo.",this.taskQueue.length);
    this.wgetList();
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

Yelp.prototype.load=function(){
    if(fs.existsSync(this.resultDir+this.doneFile)){
	fs.readFileSync(this.resultDir+this.doneFile)
	    .toString()
	    .split('\r\n')
	    .reduce(function(pre,cur){
		if(cur)
		    pre[cur]=true;
		return pre;
	    },this.doneFlights);
    }
    if(fs.existsSync(this.dataDir+this.skipFile)){
	fs.readFileSync(this.dataDir+this.skipFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,cur){
		if(cur){
		    cur = cur.replace('\r','');
		    pre[cur]=true;
		}
		return pre;
	    },this.citySkip);
    }
}
var sleepTime = 2400000;
var sleepCount = 0;
Yelp.prototype.processList = function(data,args){
    if(!data){
	console.log("data empty");
	return;
    }
    console.log("data got: %s, %s, %d",args[0].city,args[0].cate,args[0].start);
    var $ = cheerio.load(data);
    $('ul.ylist li span.review-count').each(function(){
	++args[0].shopCount;
	var txt = $(this).text();
	var m = txt && txt.match(/\d+/);
	if(m && m[0]){
	    args[0].reviews += Number(m[0]);
	}
    });
    
    var pageOfPages = $('div.page-of-pages').text().trim();
    var m = pageOfPages && pageOfPages.match(/\d+/g);
    var totalPages = m && m[1];
    
    var maxStartIdx = (totalPages-1)*10;
    if(args[0].start < maxStartIdx){
	args[0].start += 10;
    }else{
	//append to file.
	var record = [args[0].city,args[0].cate,args[0].shopCount,args[0].reviews,'\n'].join();
	fs.appendFile(this.resultDir + this.resultFile,record);
	console.log(record);
    }
    this.wgetList(args[0]);
}

Yelp.prototype.wgetList = function(t){
    if(!t || t.start>=990){
	t = this.taskQueue.shift();
	t.start = 0;
	t.shopCount=0;
	t.reviews = 0;
    }
    //console.log("GET %s-%s: %d/%d",);
    
    var query = new this.searchQuery(t.city,t.cate,t.start);
    var opt = new helper.basic_options('www.yelp.com','/search','GET',false,false,query);
    opt.agent=false;
    helper.request_data(opt,null,function(data,args){
	that.processList(data,args);
    },t);
}

var instance = new Yelp();
var that = instance;
instance.start();

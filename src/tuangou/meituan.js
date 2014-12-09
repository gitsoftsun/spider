var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')

function Mt(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "meituan.txt";
    this.cityFile = "meituan_city.txt";
    this.categoryFile = "meituan_categories.txt";
    this.cities = [];
    
    this.categories = [];
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
}

Mt.prototype.init = function(){
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
	return {id:vals[0],name:vals[1],code:vals[2]};
    });
    this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {id:vals[0],name:vals[1]};
    });
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	console.log("[DONE COUNT] %d",doneCount);
	return;
    }
    fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').map(function(line){
	if(line){
	    return line.split(',')[3];
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
    console.log("[CATEGORIES] %d",this.categories.length);
}

Mt.prototype.start = function(){
    this.init();
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.categories.length;j++){
	    if(this.cities[i] && this.categories[j])
		this.taskQueue.push({city:this.cities[i],cate:this.categories[j]});
	}
    }
    this.startIdx = Number(this.startIdx) || 0;
    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    
    this.wgetList();
}
Mt.prototype.wgetList = function(t){

}

Mt.prototype.wgetDetail = function(task){

}

Mt.prototype.processDetail = function(data,args){

}

var that = new Mt();
that.start();

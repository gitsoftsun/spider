var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

var lefeng = function(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "pc_lefeng_sc.txt";
    //this.doneFile = "";
}

lefeng.prototype.start = function(){
    
}

lefeng.prototype.init = function(){
    
}

lefeng.prototype.load = function(){
    
}

lefeng.prototype.wgetList = function(){
    
}

lefeng.prototype.wgetDetail = function(){
    
}
lefeng.prototype.processList = function(){
    
}

var instance = new lefeng();
var that = instance;
instance.start();

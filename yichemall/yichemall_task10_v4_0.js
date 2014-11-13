/*
Todo: task 10
[collecte information(include: car-brand, car-models, Big-Sale-Price, Mall-Price, Factory-Price, salingArea)
from www.yichemall.com]

inc   : BDA Inc.
author: Mark   email : bda20141107@gmail.com
date  : 2014/11/12

language: javascript

nodejs module : cheerio & http & fs & selfModules
version: 4.0

==	website tree  ==
			index
			  |
	---------------------
	|	|	|	|	|	|
  audi bmw
  	|
-------------
|	|	|	|
A7	A8	A6	Q7
|
-----
|	|
FSI TFSI
*/
var helper = require("../helpers/webhelper.js");
var cheerio = require("cheerio");
var fs = require("fs");
var path = require("path");
var url = require("url");

var root = "http://59.151.102.205" || "http://www.yichemall.com";//the root page url

//queue for urls
var brandQueue = [];
var carTypeQueue = [];

function getBrand(rootURL){
	var t = url.parse(rootURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			var i = 0;
			$("div.brands-item-wraper > a").each(function(i, e){
				console.log(i++ + " : " + $(e).text());
				var brandURL = rootURL + $(e).attr("href");
				brandQueue.push(brandURL);
			});
			travBrand(brandQueue);
		}
	});	
}

function getCarType(brandURL){//che xing
	var t = url.parse(brandURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			var i = 0;
			$("a.dis_in_block.mt10").each(function(i, e){
				console.log($(e).attr("href"));
				carTypeQueue.push(root + $(e).attr("href") + '\n');
			});
			travCarType(carTypeQueue);
		}
	});
}

function getCarModel(typeURL){//kuan shi
	var t = url.parse(typeURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			try{
				var dataModelId = {"modelId": $("#ModelId").val(), "productName": $("#ProductName").val()};
				var opt = new helper.basic_options(root, "/SingleProduct/GetProductList", null, false, true);
				helper.request_data(opt, dataModelId, function(data, args){
					console.log(data.Product[0].CarId);
				});
				//$.post(, dataModelId, function (res) { console.log(res.Product[0].CarId); }, "json");
			}catch(err){
				console.log(err);
			}
		}
	})
}

function travBrand(qBrand){//queue of brands url
	var len = qBrand.length;
	for(var i = 0; i < len; i++){
		var current = qBrand.shift();
		getCarType(current);
	}
}

function travCarType(qCarType){
	var len = carTypeQueue.length;
	for(var i = 0; i < len; i++){
		var current = qCarType.shift();
		getCarModel(current);
	}
}

getBrand(root);
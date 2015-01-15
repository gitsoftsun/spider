var fs = require('fs')
var querystring = require('querystring')
var helper = require('../helpers/webhelper.js')
var Crawler = require('crawler')

var c = new Crawler({
    maxConnections:1,
    callback:processList
});

function processList(error,result,$){
    if(error){
	console.log(error);
	return;
    }
    var records = [""];
    $(".list ul li .list-infoBox").each(function(){
	var tit = $("p.infoBox a.info-title",this).attr("title");
	tit = tit && tit.replace(/,，/g,"");
	var info = $("p.fc-gray",this).text().trim();
	var vals = info.split("|");
	var time = vals[0].trim();
	var distance = vals[1].trim();
	var price = $("p.priType-s span i",this).text().trim();
	var mktPrice = $("p.priType-s s",this).text().trim();
	var r = [tit,time,distance,price,mktPrice].join();
	records.push(r);
    });
    console.log("[DONE] %s",result.uri);
    fs.appendFileSync("../result/ganji_haoche.txt",records.join("\n"));
    var url = $("ul.pageLink li>a.next").attr("href");
    url = url && ("http://haoche.ganji.com/"+url);
    if(url){
	c.queue(url);
    }
}

c.queue("http://haoche.ganji.com/bj/buy");
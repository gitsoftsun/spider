var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var Crawler = require("crawler")
var util = require("util")
var iconv = require("iconv-lite")

var c = new Crawler({
    maxConnections:5
    ,callback:processCity
    //,userAgent:"Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)"
});

var n=1
,cities=["bj"]
,host = "http://souke.xdf.cn"
,resultFile = "../../result/vertical/leju.txt"
;

function processCity(error,result,$){
    if(error){
	console.log(error);
	//c.queue(result.uri);
	return;
    }
    if(!$)
	return;
    $("#selectcity_pop ul li a").each(function(){
	var url = $(this).attr("href");
	var txt = $(this).text();
	
	c.queue({uri:host+url,callback:processCategory});
    });
    console.log("[DATA] %s",result.uri);
}

function processCategory(error,result,$){
    if(error){
	console.log(error);
	//c.queue(result.uri);
	return;
    }
    if(!$){
	return;
    }
    $("div.box4 dl dt a").each(function(){
	var url = $(this).attr("href");
	//;
	c.queue({uri:host+url+"&hide=0",callback:processList});
    });
    console.log("[DONE] %s",result.uri);
}

function processList(error,result,$){
    if(error){
	console.log(error);
	//c.queue(result.uri);
	return;
    }
    if(!$)
	return;
    $("div.class-item a.u-btn").each(function(){
	var url = $(this).attr("href");
	c.queue({uri:host+url,callback:processDetail});
    });
    console.log("[DATA] %s",result.uri);
    var nextPageBtn = $("div.coli_page .nextlink");
    if(nextPageBtn.length>0){
	c.queue({uri:nextPageBtn.attr('href'),callback:processList});
    }
}
function processDetail(error,result,$){
    if(error){
	console.log(error);
	//c.queue();
	return;
    }
    if(!$)
	return;
    var records = [""];
    var cates = $("p.position").text().replace(/>/g,",");
    
    $("ul.kc_cont").each(function(){
	var no = $("li.seg2 span.classNum",this).text();
	var p = $("li.seg2 span.pNum",this).text();
	
	var time = $("li.seg6 dl.tLists dd",this).eq(0).text().trim();
	var addr = $("li.seg6 dl.tLists dd",this).eq(1).text().trim();
	
	var price = $("li.seg10 span.price em",this).text().trim();
	
	records.push(cates+","+[no,p,time,addr,price].join());
    });
    var r = records.join("\n");
    console.log(r);
    fs.appendFileSync(resultFile,r);
    var nextPageBtn = $("div.coli_page .nextlink");
    if(nextPageBtn.length>0){
	c.queue({uri:nextPageBtn.attr('href'),callback:processDetail});
    }
    //c.queue(util.format("http://t.jzt.58.com/%s/xiaoshigongzyy/pn%d/?from=index_daojia_2",city,n));
}
//var city = cities.shift();
c.queue("http://souke.xdf.cn/Category/1.html");

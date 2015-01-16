var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var Crawler = require("crawler")
var util = require("util")
var iconv = require("iconv-lite")

var c = new Crawler({
    maxConnections:5
    ,callback:processCity
    ,userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
});

var n=1
,cities=["bj"]
,host = "http://souke.xdf.cn"
,resultFile = "../../result/vertical/xdf_"+new Date().toString()+".txt"
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
    var records = [""]
    ,cates = $("p.position").text().split(/>/);
    var cate1 = cates[1]
    ,cate2 = ''
    ,cate3 = ''
    ,city = $("#selectcity cite.selected").text().trim()
    ;
    if(cates.length>2)
	cate2=cates[2];
    if(cates.length>3)
	cate3 = cates[3];
    
    $("ul.kc_cont").each(function(){
	var no = $("li.seg2 span.classNum",this).text();
	var p = $("li.seg2 span.pNum",this).text();
	
	var time = $("li.seg6 dl.tLists dd",this).eq(0).text().trim();
	time = time && time.replace(/时间：/g,'').replace(/\s/g,'');
	var addr = $("li.seg6 dl.tLists dd",this).eq(1).text().trim();
	addr = addr && addr.replace(/\s/g,'').replace(/地点：/g,'');
	var price = $("li.seg10 span.price em",this).text().trim();
	records.push(cate1+"\t"+cate2+"\t"+cate3+'\t'+[no,p,time,addr,price,city].join("\t"));
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

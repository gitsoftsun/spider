var Crawler = require('crawler')
var fs = require('fs')
var helper = require("../../helpers/webhelper.js")

var list = ["http://global.vip.com"
	    ,"http://www.vip.com"
	    ,"http://home.vip.com"
	    ,"http://beauty.vip.com"
	   ];
var resultFile="../../result/vertical/vip_count.txt";
var today = new Date().toDatetime();
function te_salePlan(o){
    return o;
}

function countItem(error,result,$){
    if(error) console.log(error);
    var tit = $("title").text().trim();
    var count = $("div.fr span.page_total").text().trim();
    var c = count && count.match(/\d+/)[0];
    if(!c){
	c=0;
	var reg = /detail\-\d+\-\d+\.html/;
	$("a").each(function(){
	    var url = $(this).attr('href');
	    if(reg.test(url)){
		c++;
	    }
	});
    }
    var r = tit+"\t"+c+"\t"+today+"\n";
    console.log(r);
    fs.appendFileSync(resultFile,r);
}

var hash = {};

function fn(item){
    return "http://www.vip.com/show-"+item.id+".html";
}

function ajaxinfo(error, result, $) {
    if(error) console.log(error);
    var obj = eval(result.body);
    if(obj.part_top instanceof Array){
	return;
    }
    obj.part_top.items.map(fn).forEach(function(item){
	if(!hash[item]) {
	    hash[item]=true;
	    c.queue({uri:item,callback:countItem});
	}
    });
    obj.part1.items.map(fn).forEach(function(item){
	if(!hash[item]) {
	    hash[item]=true;
	    c.queue({uri:item,callback:countItem});
	}
    });
    obj.part2.items.map(fn).forEach(function(item){
	if(!hash[item]) {
	    hash[item]=true;
	    c.queue({uri:item,callback:countItem});
	}
    });
}

var c = new Crawler({
    maxConnections : 5,
    // This will be called for each crawled page
    callback : function(error,result,$){
	if(error){
	    return;
	}
	var reg = /show\-\d+\.html/;
	$("a").each(function(){
	    var url = $(this).attr('href');
	    if(reg.test(url) && !hash[url]){
		hash[url] = true;
		c.queue({uri:url,callback:countItem});
	    }
	});
	var matches = result.body.match(/newToday\s=\s([^\n]+)/);
	var dt = matches && matches[1].trim();
	if(dt){
	    if(dt[dt.length-1]==';')
		dt = dt.slice(0,-1);
	    JSON.parse(dt).map(fn).forEach(function(item){
		if(!hash[item]){
		    hash[item]=true;
		    c.queue({uri:item,callback:countItem});
		}
	    });
	}
	matches = result.body.match(/label\s=\s([^\n]+)/);
	dt = matches && matches[1].trim();
	if(dt){
	    if(dt[dt.length-1]==';')
		dt = dt.slice(0,-1);
	    JSON.parse(dt).map(fn).forEach(function(item){
		if(!hash[item]){
		    hash[item]=true;
		    c.queue({uri:item,callback:countItem});
		}
	    });
	}
	var reg = /data : (\[[^\]]+\])/g;
	while(matches = reg.exec(result.body)){
	    dt = matches[1];
	    JSON.parse(dt).map(fn).forEach(function(item){
		if(!hash[item]){
		    hash[item]=true;
		    c.queue({uri:item,callback:countItem});
		}
	    });
	}
	
	matches = result.body.match(/VIPHOME.todayBrandData = (\[[^\]]+\])/);
	if(matches && matches.length>0){
	    dt = matches[1];
	    if(dt){
		JSON.parse(dt).map(fn).forEach(function(item){
		    if(!hash[item]){
			hash[item]=true;
			c.queue({uri:item,callback:countItem});
		    }
		});
	    }
	}
	matches = result.body.match(/VIPHOME.hotBrandData = (\[[^\]]+\])/);
	if(matches && matches.length>0){
	    dt = matches[1];
	    if(dt){
		JSON.parse(dt).map(fn).forEach(function(item){
		    if(!hash[item]){
			hash[item]=true;
			c.queue({uri:item,callback:countItem});
		    }
		});
	    }
	}
    }
});

c.queue({uri:"http://www.vip.com/index-ajax.php?callback=te_salePlan&act=getDayBrandList&warehouse=VIP_BJ&date="+new Date().toDatetime().replace(/\-/g,'')+"&channelId=0&t=1",callback:ajaxinfo});
//c.queue(list[0]);
list.forEach(function(l){
    c.queue(l);
});

/*var $ = cheerio.load(fs.readFileSync("index.html").toString());
var reg = /show\-\d+\.html/;
$("a").each(function(){
    var url = $(this).attr('href');
    if(reg.test(url) && !hash[url]){
	hash[url]=true;
	//c.queue({uri:url,callback:countItem});
    }
});

console.log(Object.keys(hash).length);
*/

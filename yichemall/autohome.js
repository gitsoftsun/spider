	/*
	filename :
	Author   : Mark    e-mail: bda20141107@gmail.com(Only when i work in BDA Inc.)
	Date     : 2014/11/10
	function :
		get specify information form autohome.com by my spider. ^_^
	Modules  :
	    (node.js)
		  --cheerio
		  --http
		  --fs
	*/
	var cheerio = require("cheerio");
	var http = require("http");
	var fs = require("fs");

	var queue = [];
	var queue_pp = [];
	function download(url, callback){
		http.get(url, function(res){
			var data = "";
			res.on('data', function(chunk){
				data += chunk;
			});

			res.on('end', function(){
				callback(data);
			});
		}).on("error", function(){
			callback(null);
		});
	}

	var basicURL = "http://1111.autohome.com.cn/";
	var url = "http://1111.autohome.com.cn/plist-0-0-0-0-0-1-1-0-1-0.html";

	download(url, function(data){
		if(data){
			var $ = cheerio.load(data);			
			var pplist = $("dl.ssy-filter-pp > dd > div > a").each(function(i,e ){
				var url = basicURL + $(e).attr("href");
				queue.push(url);
				queue_pp.push($(e).text());
			});

			//delete the first url->itself
			queue.shift();
			for(var i = 1, _len = queue.length; i <= _len; i++){
				var x = queue.shift();
				var pp = queue_pp.shift();

				console.log("pp = " + pp + "[fetch] " + i + 'th url : ' + x);
				download(x, function(data){
					if(data){
						//analysis 1st page
						var $ = cheerio.load(data);
						var list = $("div.ssy-list > ul > li > a").each(function(i, e){
							var Model = $("h2", this).text().trim();
							fs.appendFileSync('../result/autohome.txt',pp + " " +  Model + ",");
							var MarketPrice = $("div.ssy-list-price2 > span > del", this).text().trim();
							fs.appendFileSync('../result/autohome.txt', MarketPrice + ",");
							var Price_11_11 = $("div.ssy-list-price1 > b", this).text().trim();
							fs.appendFileSync('../result/autohome.txt', Price_11_11 + ",");
							var AreaDealer = $("div.ssy-list-bottom", this).text().trim();
							fs.appendFileSync('../result/autohome.txt', AreaDealer + "\n");
						});
						var $ = cheerio.load(data);
						var index;
						var urlnext;
						var pageindex = $("span.ssy-pager-pageindex > a").each(function(i,e){
							index = $(e).text();
							urlnext = $(e).attr("href");
						});

						for(var j = 2; j <= index; j++){
							//how to makeup URL?
							url = "http://1111.autohome.com.cn/plist-" + urlnext.split(/-/)[1] + "-0-0-0-0-1-1-0-" + j + "-0.html"
							download(url, function(data){
								if(data){
									var $ = cheerio.load(data);
									var list = $("div.ssy-list > ul > li > a").each(function(i, e){
										var Model = $("h2", this).text().trim();
										fs.appendFileSync('../result/autohome.txt', pp + " " + Model + ",");
										var MarketPrice = $("div.ssy-list-price2 > span > del", this).text().trim();
										fs.appendFileSync('../result/autohome.txt', MarketPrice + ",");
										var Price_11_11 = $("div.ssy-list-price1 > b", this).text().trim();
										fs.appendFileSync('../result/autohome.txt', Price_11_11 + ",");
										var AreaDealer = $("div.ssy-list-bottom", this).text().trim();
										fs.appendFileSync('../result/autohome.txt', AreaDealer + "\n");
									});
								}else{
									console.log('[failed] to fetch url : ' + url);
								}
							});
						}
					}
				});
}
}else{
	console.log('[this page false] : ' + url);
}
});
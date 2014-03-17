var fs = require('fs')
var $ = require("jquery")
var entity = require('./models/entity.js')

function start(){
	var dir = "qunar_hotel";
	var files = fs.readdirSync(dir);

	for(var i=0;i<files.length;i++){
		var hotel = new entity.hotel();
		var names = files[i].split(',');
		hotel.city = names[0];
		hotel.name = names[1];
		var f = dir+'/'+files[i];

		var cont = fs.readFileSync(f).toString();

		var items = $(cont).find("ul.e_prcDetail_ulist li");
		if(items.length>0){
			items.each(function(i,e){
				var r = new entity.room();
				r.name = $(e).find("span.enc2").text();
				r.book=[];
				//r.price = $(e).find("span.h1_pirce b.pr").text();
				$(e).find(".e_prcDetail_item table:first-child").each(function(j,ele){
					var s = {};
					s.name = $(ele).find(".td1 .profile_tips .prf_tit").text();
					s.price = $(ele).find(".td4 div.ht_prc p.h2_pirce").text();
					//console.log($(ele).find(".td4 div.ht_prc p.h2_pirce b.pr").length);
					//console.log(r.name+","+s.name+","+s.price);
					s.fan = $(ele).find(".td4 div.ht_prc a span.fan em.pr").text();
					
					r.book.push(s);
				});
				hotel.rooms.push(r);
			});
		}else{
			$(cont).find("ul.e_agentslist li").each(function(i,e){
				var r = new entity.room();
				r.name = $(e).find("span.enc2").text();
				r.book = [];
				$(e).find(".e_prcDetail_item table:first-child").each(function(j,ele){
					var s = {};
					s.name = $(ele).find(".td1 .profile_tips .prf_name").text();
					s.price = $(ele).find(".td4 div.ht_prc p.h2_pirce").text();
					s.fan = $(ele).find(".td4 div.ht_prc a span.fan em.pr").text();
					r.book.push(s);
				});
				hotel.rooms.push(r);
			});
		}
		
		fs.appendFileSync("pc_qunar_hotel.txt",hotel.toString("qunar_pc"));
		
		console.log("["+(i+1)+"]."+hotel.name);
		//break;
	}
}

start();
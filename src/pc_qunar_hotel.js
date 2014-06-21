var fs = require('fs')
var cheerio = require('cheerio')
var entity = require('../models/entity.js')

var arguments = process.argv.splice(2);

function QunarHotel(){
    this.files=[];
    this.resultFile="pc_qunar_hotel.txt";
    this.resultDir="../result/";
    this.htmlDir = 'qunar_hotel/';
    this.doneFile = "pc_qunar_done_hotel.txt";
}

QunarHotel.prototype.load=function(){
    if(!fs.existsSync(this.resultDir+this.htmlDir)){
	console.log("qunar_hotel dir not found");
	return;
    }
    this.files = fs.readdirSync(this.resultDir+this.htmlDir); 
}
QunarHotel.prototype.filterData=function(){
    if(this.files.length==0) return;
    console.log(this.files.length + " files to do");
    for(var i=0;i<this.files.length;i++){
	var hotel = new entity.hotel();
	var names = this.files[i].split(',');
	hotel.city = names[0];
	//hotel.name = names[1];
	var f = this.resultDir+this.htmlDir+this.files[i];
	
	var $ = cheerio.load(fs.readFileSync(f).toString());
	hotel.name = $("div.htl-info h2 span").text().trim();
	hotel.star = $("div.htl-info h2 em").attr("title");
	var m = $("link[rel$='canonical']").attr('href').match(/([^\/]+\/[a-zA-Z\-\d]+)\/$/);
	hotel.id = m && m[1];
	
	console.log(hotel.id);
	if($(".htl-type-list li").length>0){
	    $(".htl-type-list li").each(function(){
		var r = new entity.room();
		r.name = $("div.type-title table tr td span.type-name",this).text();
		r.name = r.name && r.name.trim().replace(/[,]/g,';');
		r.book=[];
		$(".similar-type-agent-list .similar-type-agent-item table:first-child tr",this).each(function(){
		    var s = {};
		    s.name = $("td.c1 div.profile-tit",this).text();
		    s.name = s.name && s.name.replace(/[,]/g,';');
		    s.price = "¥"+$("td.c6 p.final-price b.pr",this).text();
		    s.fan = $("td.c6 span.fan",this).text();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}
	else if($("ul.e_prcDetail_ulist li").length>0){
	    $("ul.e_prcDetail_ulist li").each(function(){
		var r = new entity.room();
		r.name = $("span.enc2",this).text();
		r.name = r.name && r.name.trim().replace(/[,]/g,';');
		r.book=[];
		$(".e_prcDetail_item table:first-child",this).each(function(){
		    var s = {};
		    s.name = $(".td1 .profile_tips .prf_tit",this).text();
		    s.name=s.name&&s.name.replace(/[,]/g,';');
		    s.price = $(".td4 div.ht_prc p.h2_pirce",this).text();
		    //console.log($(ele).find(".td4 div.ht_prc p.h2_pirce b.pr").length);
		    //console.log(r.name+","+s.name+","+s.price);
		    s.fan = $(".td4 div.ht_prc a span.fan em.pr",this).text();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}else{
	    $("ul.e_agentslist li").each(function(){
		var r = new entity.room();
		r.name = $("span.enc2",this).text();
		r.name = r.name && r.name.replace(/[,]/g,';');
		r.book = [];
		$(".e_prcDetail_item table:first-child",this).each(function(){
		    var s = {};
		    s.name = $(".td1 .profile_tips .prf_name",this).text();
		    s.name=s.name && s.name.replace(/[,]/g,';');
		    s.price = $(".td4 div.ht_prc p.h2_pirce",this).text();
		    s.fan = $(".td4 div.ht_prc a span.fan em.pr",this).text();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}
	fs.appendFileSync(this.resultDir+this.doneFile,hotel.city+','+names[1]+','+names[2].replace(/\.html/,'')+','+hotel.id+','+hotel.name+"\r\n");
	fs.appendFileSync(this.resultDir+this.resultFile,hotel.toString("qunar_pc"));
	console.log("["+(i+1)+"]."+hotel.name);
    }
}

var qunar = new QunarHotel();
qunar.load();
qunar.filterData();

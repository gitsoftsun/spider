var fs = require('fs')
var hotels;
function start(){
    hotels={'0':{},'1':{},'2':{}};
    var lines = fs.readFileSync("hcf.txt").toString().split('\r\n');
    console.log("total hotels: "+lines.length);
    
    for(var i=2;i<lines.length-1;i++){
	var l = lines[i];
	var vals = l&&l.split(",");
	//console.log(l);
	var site;// = i%3;//2->ctrip,1->qunar,0->elong
	//cityName,fullName,siteName,star,room,book_site,url
	var book='';
	if(vals[7]&&vals[7].trim()){
	    book = vals[7].trim().replace(/[\.\d]*/,'');
	}
	var room = vals[6].replace(/[\(|\[|\（].+/,'');
		//room.replace(//,'');
	room = room.replace('房','').replace('间','').replace(/\s+/,'');
	var o = {'c':vals[1],'fname':vals[2].trim(),'sname':vals[3].trim(),'site':vals[4].trim(),'star':vals[5],'room':room,'book':book,'url':vals[10].trim()};
	if(o.site=="eLong"){
	    site = 0;
	}else if(o.site=="Ctrip"){
	    site=2;
	}else{
	    site=1;
	}
	hotels[site][o.sname]=o;
	hotels[o.fname]=o;
	//hotels[site].push();

	//console.log(o.sname+','+o.room);
	//console.log(o);
	//if(i>10) break;
    }
    lines = null;

    
}
//read elong file.
function elong(){
    
    var lines = fs.readFileSync("pc_elong_hotel-.txt").toString().split('\r\n');
    var last,ava=0;
    for(var i=0;i<lines.length-1;i++){
	var l = lines[i];
	var vals = l&&l.split(',');

	//cityName,siteName,room,price,fan
	//console.log(vals[0]+","+vals[1]+","+vals[4]+","+vals[12]+","+vals[13]);
	if(hotels[0][vals[1]]){
	    last = hotels[0][vals[1]];
	    for(;;i++){
		l = lines[i];
		vals = l&&l.split(",");
		if(vals[1].trim()!=last.sname) {
		    i--;
		    break;
		}
		var roomName = vals[4].trim().replace(/[\(|\[].+/,'');
		roomName = roomName.replace('房','').replace('间','').trim();

		if(roomName==last.room){
		    last.price = vals[12];
		    last.fan = vals[13];
		    ava++;
		}
	    }
	}
    }
    console.log("avaliable elong lines: "+ava);
}
function qunar(){
    var lines = fs.readFileSync("pc_qunar_hotel.txt").toString().split('\r\n');
    var last,j=0;
    for(var i=0;i<lines.length;i++){
	var l = lines[i];
	var vals = l&&l.split(',');

	if(hotels[1][vals[1]]){j++;
	    last = hotels[1][vals[1]];
	    for(;;i++){
		l = lines[i];
		vals = l&&l.split(",");
		if(!vals||vals.length<6) break;
		else if(vals[1].trim()!=last.sname){
		    i--;
		    break;
		}
		var roomName = vals[2].trim().replace(/[\(|\[].+/,'');
			roomName = roomName.replace('房','').replace('间','').trim();
			var price = vals[4];
			if(price&&price.indexOf("返")!=-1){
				price = price.replace(/返/,'-');
			}
			price = price.replace(/￥/g,'');
			price = price.replace(/[^\d\-\+]/g,'');
			price = eval(price);

		if(roomName==last.room){
			if(last.price==undefined||last.price>price){
				last.price = price;
				last.fan = vals[5];
				last.book = vals[3];
			}
		}
	    }
	}
    }
    console.log(j);
}

function ctrip(){
    var lines = fs.readFileSync("pc_ctrip_hotel-.txt").toString().split("\r\n");
    var last;
    console.log("total ctrip lines: "+lines.length);
    for(var i=0;i<lines.length;i++){
	var l = lines[i];
	var vals = l&&l.split(',');
	if(hotels[2][vals[1]]){
	    last = hotels[2][vals[1]];
	    for(;;i++){
		l = lines[i];
		vals = l&&l.split(',');
		if(vals.length<7){
			break;
		}
		else if(vals[1].trim()!=last.sname){
		    i--;
		    break;
		}
		var roomName = vals[3].trim().replace(/[\(|\[].+/,'');
			roomName = roomName.replace('房','').replace('间','').trim();
			roomName = roomName.replace('携程标准价','');
			var price = vals[5];
			if(price){
				price = price.replace('¥','');
				if(isNumber(price))
					price = Number(price);
				else
					price = 100000;
			}

			if(vals[6]){
				var matches = vals[6].match(/\d+/);
			if(matches&&matches.length>0)
			    var fan = matches[0];
				if(fan)
					price = price - Number(fan);
		    }
		if(roomName==last.room&&(last.price==undefined||last.price>price)){
		    last.price = price;
		    last.fan = '';
		}else{
			
			//console.log(last.c+","+last.sname+","+last.room.replace(/\([^\)]*\)/,'')+","+vals[3].trim());
		}
	    }
	}else{
		//console.log(vals[1]);
	}
    }
    
}
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
//cityName,fullName,siteName,star,room,book_site,price,fan,url
//2->ctrip,1->qunar,0->elong
function output(){
	
    for(var k in hotels[2]){
	 	var c = hotels[2][k];
	 	if(c){
		 	console.log(c.c+","+c.fname+","+c.sname+","+c.site+","+c.star+","+c.room+","+c.book+","+c.price+","+c.fan+","+c.url);
		}
    }

    // for(var k in hotels[0]){
    // 	var e = hotels[0][k];
    // 	if(e){
    // 		console.log(e.c+","+e.fname+","+e.sname+","+e.site+","+e.star+","+e.room+","+e.book+","+e.price+","+e.fan+","+e.url);
    // 	}
    // }

    // for(var k in hotels[1]){
    // 	var q = hotels[1][k];
    // 	if(q){
    // 		console.log(q.c+","+q.fname+","+q.sname+","+q.site+","+q.star+","+q.room+","+q.book+","+q.price+","+q.fan+","+q.url);
    // 	}
    // }
}
start();
//elong();
ctrip();
//qunar();

output();
var fs = require('fs')

function FilterMerge(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.elonghFile = "elonghotels.txt";
    this.ctriphFile = "pc_ctrip_done_hotel.txt";
    this.qunarhFile = "pc_qunar_done_hotel.txt";
    this.elongrFile = "pc_elong_hotel.csv";
    this.ctriprFile = "pc_ctrip_hotel-.txt";
    this.qunarrFile = "pc_qunar_hotel.txt";
    this.elongHotels=[];
    this.ctripHotels=[];
    this.qunarHotels=[];
    this.elongRecords=[];
    this.ctripRecords=[];
    this.qunarRecords=[];
    this.dictCtHotel = {};
    this.dictQuHotel={};
    this.dictElHotel={};
}

FilterMerge.prototype.init=function(){
    if(!fs.existsSync(this.resultDir+this.elonghFile)
       ||!fs.existsSync(this.resultDir+this.ctriphFile)
       ||!fs.existsSync(this.resultDir+this.qunarhFile))
	throw "Data file not found.";
}

FilterMerge.prototype.load=function(){
    this.elongHotels = fs.readFileSync(this.dataDir+this.elonghFile).toString().split('\n');
    this.ctripHotels = fs.readFileSync(this.resultDir+this.ctriphFile).toString().split('\n');
    this.qunarHotels = fs.readFileSync(this.resultDir+this.qunarhFile).toString().split('\n');
    
    console.log("Before preprocessing, elong: "	+this.elongHotels.length
		+", ctrip: "+this.ctripHotels.length
		+", qunar: "+this.qunarHotels.length);
}

FilterMerge.prototype.merge = function(){
    var result = [];
    var c=0;
    for(var k in this.dictElHotel){
	var h = this.dictElHotel[k];
	if(!h.crooms || !h.erooms || !h.qrooms)
	    continue;
	//console.log(h);

	for(var i=0;i<h.erooms.length;i++){
	    for(var j=0;j<h.crooms.length;j++){
		for(var k=0;k<h.qrooms.length;k++){
		    if(h.crooms[j].type==h.erooms[i].type && h.qrooms[k].type==h.erooms[i].type){
			c++;
			if(this.ItsFactor(h.crooms[j].tags,h.erooms[i].tags)>=0.7){
			    var str = h.city+","+h.ename+','+h.cname+','+h.qname+','+h.crooms[j].type+','+h.star+','+h.crooms[j].price+','+h.crooms[j].fan+','+h.erooms[i].price+','+h.erooms[i].fan+','+h.qrooms[k].price+','+h.qrooms[k].fan+','+h.qrooms[k].book;
			    console.log(str);
			}
		    }
		}
	    }
	}
    }

    console.log(c);
}


FilterMerge.prototype.ItsFactor=function(a,b){
    var len = a.length>b.length?a.length:b.length;
    if(len==0)
	return 1;
    var equalTag=0;
    for(var i=0;i<a.length;i++){
	for(var j=0;j<b.length;j++){
	    if(a[i]==b[j])
		equalTag++;
	}
    }
    return equalTag/len;
}

FilterMerge.prototype.preProcess=function(){
    var dictHotel={},i,j,k;
    var total=0;
    for(i=0;i<this.elongHotels.length;i++){
	if(!this.elongHotels[i]) continue;
	var vals = this.elongHotels[i].replace('\r','').split(',');
	this.dictElHotel[vals[1]]={city:vals[0],eid:vals[1],ename:vals[2]};
    }
    for(j=0;j<this.ctripHotels.length;j++){
	if(!this.ctripHotels[j]) continue;
	var vals = this.ctripHotels[j].replace('\r','').split(',');
	var ctripId = vals[4];
	if(!this.dictCtHotel[ctripId]){
	    var obj = this.dictElHotel[vals[1]];
	    if(!obj) continue;
	    obj.cid = vals[4];
	    obj.cname = vals[5];
	    obj.star = vals[6];
	    this.dictCtHotel[ctripId]=obj;
	    total++;
	}
    }
    for(k=0;k<this.qunarHotels.length;k++){
	if(!this.qunarHotels[k]) continue;
	var vals = this.qunarHotels[k].replace('\r','').split(',');
	var obj = this.dictElHotel[vals[1]];
	if(!obj) continue;
	obj.qid=vals[3];
	obj.qname=vals[4];
	this.dictQuHotel[vals[3]]=obj;
    }
    console.log("After preProcessing, elong: "+i+", ctrip: "+total+", qunar: "+k);
    
    //    this.elongRecords =
    fs.readFileSync(this.resultDir+this.elongrFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room={};
	room.tags=[];
	vals[5].match(/[\（|\(]([^\)\）])[\)|\）]/);
	room.tags.push(vals[10]);
	
	room.type  = vals[5].replace(/[\(\（\[].*/g,'').replace(/[\.\s\-]/g,'').replace(/[房间]/,'');
	//	room.type = room.type && room.type.replace(/[房间][A-Z]?$/,'');
	
	var pkg = vals[9].match(/[\【\[\(|\（]([^\)\）\]\】]*)[\]\)\）\】]/);
	if(pkg && pkg.length>1)
	    room.tags = room.tags.concat(pkg[1].split(';').map(function(p){return p.replace(/\./g,'');}));
	room.price = vals[11];
	room.fan = vals[12];
	
	//if(room.search("升级至")>-1){
	//    room = room.replace(/[^升级至]/,'').replace(/[升级至]/g,'');
	//}
	var obj = that.dictElHotel[vals[1]];

	if(obj){
	    if(obj.erooms==undefined)
		obj.erooms = [];
	    obj.erooms.push(room);
	    //	    console.log(obj.rooms.length+","+obj.eid);
	}
	/*	
		return {city:vals[0],
		id:vals[1],
		name:vals[2],
		star:vals[4],
		room:room,
		price:vals[13],
		fan:vals[14]};*/
    });
    //    console.log(this.elongRecords[234]);
    //    this.ctripRecords =
    fs.readFileSync(this.resultDir+this.ctriprFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room = {};
	var pkg = vals[4].match(/[\(\（]([^\)\）]*)[\)|\）]/);
	room.type = vals[4].replace(/[房间]/g,'').replace(/[\(\（\[].*/g,'').replace("携程标准价",'');
	room.tags=[];
	room.tags.push(vals[9]);
	if(pkg && pkg.length>1)
	    room.tags = room.tags.concat(pkg[1].split(';').map(function(p){return p.replace(/\./g,'');}));
	room.price = vals[6].trim()=="专享价"?"¥100000":vals[6].trim();
	room.fan = vals[7]?vals[7]:"返0元";
	
	var obj = that.dictCtHotel[vals[1]];
	if(obj){
	    if(obj.crooms==undefined)
		obj.crooms = [];
	    obj.crooms.push(room);
	}
	/*
	  return {city:vals[0],
	  id:vals[1],
	  name:vals[2],
	  star:vals[3],
	  room:room,
	  price:vals[6].trim()=="专享价"?"¥100000":vals[6].trim(),
	  fan:vals[7]?vals[7]:"返0元"
	  };*/
    });
    //    console.log(this.ctripRecords[234]);
    //    this.qunarRecords=
    fs.readFileSync(this.resultDir+this.qunarrFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room = {};
	room.tags=[];
	room.type = vals[3].replace(/[房间]/,'');
	
	room.price = vals[5];
	room.fan = vals[6]?vals[6]:"¥0";
	room.finalPrice = eval(room.price.replace(/¥/g,'')-room.fan.replace(/[返¥]/g,''));
	room.book = vals[4];
	var obj = that.dictQuHotel[vals[1]];
	if(obj){

	    if(obj.qrooms == undefined){
		obj.qrooms=[];
		obj.qrooms.push(room);
	    }
	    else{
		var exists=false;
		for(var z=0;z<obj.qrooms.length;z++){
		    if(obj.qrooms[z].type == room.type) {
			exists = true;
			if(obj.qrooms[z].finalPrice>room.finalPrice){
			    obj.qrooms[z] = room;
			}
		    }
		}
		if(!exists)
		    obj.qrooms.push(room);
	    }
	    
	}
	/*
	  return {city:vals[0],
	  id:vals[1],
	  name:vals[2],
	  room:room,
	  bookSite:vals[4],
	  price:vals[5],
	  fan:vals[6]?vals[6]:"¥0"
	  };
	*/
    });
    //    console.log(this.qunarRecords[234]);
    //    console.log("Total records, elong: "+this.elongRecords.length+", ctrip: "+this.ctripRecords.length+", qunar: "+this.qunarRecords.length);
}

FilterMerge.prototype.start=function(){
    this.init();
    this.load();
    this.preProcess();
    this.merge();
}

var fm = new FilterMerge();
var that = fm;
fm.start();


var hotels;
function start(){
    hotels={'0':{},'1':{},'2':{}};
    var lines = fs.readFileSync("../result/pc_ctrip_done_hotel.txt").toString().split('\r\n');
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
//start();
//elong();
//ctrip();
//qunar();

//output();
var fs = require('fs')

function FilterMerge(isApp){
    this.isApp = isApp;
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.elonghFile = "elonghotels.txt";
    this.ctriphFile = "pc_ctrip_done_hotel.txt";
    this.qunarhFile = "pc_qunar_done_hotel.txt";
    
    this.elongrFile = "pc_elong_hotel-.txt";
    this.ctriprFile = "pc_ctrip_hotel-.txt";
    this.qunarrFile = "pc_qunar_hotel.txt";
    if(isApp){
	this.ctriphFile = "app_ctrip_done_hotels.txt";
	this.qunarhFile = "app_qunar_hotel_done.txt";
	
	this.elongrFile = "app_elong_hotel.txt";
	this.ctriprFile = "app_ctrip_hotel.txt";
	this.qunarrFile = "app_qunar_hotel.txt";
    }
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

FilterMerge.prototype.prepareHotel = function(){
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
}
FilterMerge.prototype.preProcessApp = function(){
    fs.readFileSync(this.resultDir+this.elongrFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room = {};
	room.tags=[];
	room.tags.push(vals[13]);

	room.type = vals[4].replace(/[\(\（\[].*/g,'').replace(/[\.\s\-]/g,'').replace(/[房间]/,'');
	var pkg = vals[4].match(/[\【\[\(|\（]([^\)\）\]\】]*)[\]\)\）\】]/);
	if(pkg && pkg.length>1)
	    room.tags = room.tags.concat(pkg[1].split(';').map(function(p){return p.replace(/\./g,'');}));
	room.price = vals[5];
	room.fan = vals[6];
	var obj = that.dictElHotel[vals[1]];

	if(obj){
	    if(obj.erooms==undefined)
		obj.erooms = [];
	    obj.erooms.push(room);
	    //	    console.log(obj.rooms.length+","+obj.eid);
	}
    });
    fs.readFileSync(this.resultDir+this.ctriprFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room = {};
	var pkg = vals[5].match(/[\(\（]([^\)\）]*)[\)|\）]/);
	room.type = vals[5].replace(/[房间]/g,'').replace(/[\(\（\[].*/g,'').replace("携程标准价",'');
	room.tags=[];
	room.tags.push(vals[14]);
	if(pkg && pkg.length>1)
	    room.tags = room.tags.concat(pkg[1].split(';').map(function(p){return p.replace(/\./g,'');}));
	room.price = vals[6].trim()=="专享价"?"¥100000":vals[6].trim();
	room.fan = vals[17]?vals[17]:"返0元";
	
	var obj = that.dictCtHotel[vals[1]];
	if(obj){
	    if(obj.crooms==undefined)
		obj.crooms = [];
	    obj.crooms.push(room);
	}
    });
    fs.readFileSync(this.resultDir+this.qunarrFile).toString().split('\n').forEach(function(line){
	if(!line) return;
	var vals = line.replace('\r','').split(',');
	var room = {};
	room.tags = [];
	room.type = vals[4].replace(/\(.*/,'').replace(/[房间]/g,'');
	
	room.price = vals[6];
	try{
	    room.finalPrice = eval(room.price.replace(/[^\d\-]/g,'').replace(/\-\-/g,'-'));
	}catch(e){
	    console.log("expression error.");
	}
	room.book = vals[5];
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
    });
}
FilterMerge.prototype.preProcess=function(){
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
    this.prepareHotel();
    if(this.isApp){
	this.preProcessApp();
    }else{
	this.preProcess();
    }

    this.merge();
}

var fm = new FilterMerge(true);
var that = fm;
fm.start();

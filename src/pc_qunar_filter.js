var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')

var dirPath = "qunar_flight/";
var resultFile = "pc_qunar_flight.txt";
//var data = fs.readFileSync("北京,上海,2014-3-2,3.html").toString();


function start(){
	var files = scanFiles(dirPath);
	for(var i=0;i<files.length;i++){
		var data = fs.readFileSync(dirPath+files[i]).toString();
		var args = files[i].split(',');
		args.splice(1,1,args[1].match(/[^\d]+/)[0]);

		console.log("["+(i+1)+"]load file: "+args[0]+"-"+args[1]);

		var flightsPath = "#hdivResultPanel div.avt_column div.b_avt_lst ";
		var $data = $(data);
		$data.find(flightsPath).each(function(i,item){
			var $item = $(item);
			if($item.find("div.avt_trans").length>0) return;
			var fl = new entity.flight();
			fl.dname = args[0];
			fl.aname = args[1];
			fl.daname = $item.find(" div.c3 div.a_lacal_dep").text();
			fl.aaname = $item.find(" div.c3 div.a_local_arv").text();
			fl.flightNo = $item.find(" div.c1 div.a_name strong").text();
			var priceNodes = $item.find("div.c6 div.a_low_prc span.prc_wp em.prc b");
			fl.price = handlePrice(priceNodes);
			fl.dTime = $item.find(" div.c2 div.a_tm_dep").text();
			fl.aTime = $item.find(" div.c2 div.a_tm_arv").text();
			var result = fl.toString("qunar_pc");
			var fd = fs.openSync(resultFile,'a');
			fs.writeSync(fd,result);
			fs.closeSync(fd);
			delete fl;
			delete result;
			
			
			// fs.appendFile(resultFile,result,function(err){
			// 	if(err) console.log(err.message);
			// 	else{
			// 		console.log(args[0]+"-"+args[1]);
			// 		delete fl;
			// 		delete result;
			// 	}
			// });
		});
		delete data;
		delete $data;
		delete args;
	}
}

function handlePrice(priceNodes){
	var num = [];
	for(var i=0;i<priceNodes.length;i++){
		var st = priceNodes[i].getAttribute("style");
		var offset = st.match(/left:-(\d{2})px/)[1];
		var val = priceNodes[i].innerHTML;
		offset = Number(offset)/11*-1;
		if(i==0){
			num = val.split("");
		}else{
			num.splice(offset,1,val);
		}
	}
	return num.join('');
}

function scanFiles(path){
	if(fs.existsSync(path)){
		return fs.readdirSync(path);
	}
	return [];
}

start();
var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')
var proxy = new helper.proxy();
var proxyfile = "verified-2-25.txt";
proxy.load(proxyfile);

var requestCount = 0;
var datafile = "app_qunar_flight.txt";
function downloadImg(filename){
	var lines = fs.readFileSync(filename).toString().split('\r\n');
	for(var i in lines){
		var vals = lines[i].split(",");
		var len = vals.length;
		if(len!=6) continue;
		//var addr = vals[len-1];
		getData(vals);
	}
}
//downloadImg(datafile);
function getData(vals){
	var p = getProxy();
	//http.get({"host":p.host,"port":p.port,"path":"http://m.qunar.com/"+vals[vals.length-1]},function(res){
	http.get("http://m.qunar.com/"+vals[vals.length-1],function(res){
		var chunks = [];
	    res.on('data',function(chunk){
	        chunks.push(chunk);
	    });
	    res.on('end',function(){
	        var buffer = Buffer.concat(chunks);

	        fs.writeFile("imgs/"+vals[0]+","+vals[1]+","+vals[2]+","+vals[3].replace(":","-")+","+vals[4].replace(":","-")+".gif",buffer,function(err){
	        	if(err) console.log(err.message);
	        });
	    });
	    res.on('error',function(e){
	        console.log(e.message);
	    });
	}).on('error',function(e){
		console.log(e.message);
	});
}
function getProxy(){
  requestCount++;
  if(requestCount==1){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}

function scanImageFiles(path){
	if(fs.existsSync(path)){
		return fs.readdirSync(path);
	}
	return [];
}
function outputHtmlTag(arr){
	if(!arr) return;
	for(var i=0;i<arr.length;i++){
		var file = arr[i];
		console.log("<img id=\""+file.replace(".gif",'')+"\" src=\""+file+"\" />\r\n");
	}
}

//outputHtmlTag(scanImageFiles("imgs/"));

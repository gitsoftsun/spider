var http = require("http");
var XRegExp = require("xregexp").XRegExp;

var brandList = /"(?:\\.|[^\\\""])*"/g;

var rootURL = 'http://beijing.huimaiche.com/select';

function download(url,callback){
	http.get(url, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			callback(data);
		});
		

	}).on('error', function(){
		callback(null);
	});
}

download(rootURL, function(data){
	if(data){
		console.log(data);
	}else{
		console.log('[failed] to fetch url : ' + rootURL);
	}
});
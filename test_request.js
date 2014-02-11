var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var options = {
	host:'m.elong.com',
	path:'/hotel/list?ktype=&cityname=上海&keywords=酒店名称%2F位置不限&lng=&lat=&checkindate=2014-02-09&checkoutdate=2014-02-10',
	port:80,
	method:'GET',
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36',
		//"X-Requested-With":"XMLHttpRequest",
		//"Accept":"application/json, text/javascript, */*; q=0.01",
		"Accept-Encoding":"gzip, deflate",
		"Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
		//"Content-Type":"application/json",
		"X_FORWARDED_FOR":"58.99.128.66",
	}
};


var req = http.get(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  //res.setEncoding('utf8');
  var chunks=[];
  
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunks.push(chunk));
  });
  res.on('end',function(){
  	if(res.headers['content-encoding']=='gzip'){
  	var buffer = Buffer.concat(chunks);
  	zlib.gunzip(buffer,function(err,decoded){
  		//fs.writeFile('data.html',decoded.toString(),function(err){
  		//	if(err) throw err;
  		//	console.log('file saved.');
      console.log(decoded&&decoded.toString());
  		//});
  	});
  }
  });
});


//var firstVisit = http.get("m.ctrip.com/html5/Hotel/",function(res){
//	console.log(res.headers["Set-Cookie"]);
	
//});
// firstVisit.on('error',function(err){
// 	console.log(err);
// })



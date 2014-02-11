var http = require('http');
var get_headers={
    "User-Agent":"Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)"
    
};

var ajax_post_headers = {
    "Accept":"*/*",
    "Accept-Encoding":"gzip,deflate,sdch",
    "Accept-Language":"zh-CN,zh;q=0.8,en;q=0.6",
    "Connection":"keep-alive",
    "Content-Length":"306",
    "Content-Type":"application/x-www-form-urlencoded",
    "Cookie":"_bfa=1.1392001243067.v6whi3.1.1392001243067.1392001243067.1.1; _bfs=1.1; _bfi=p1%3D212092%26p2%3D0%26v1%3D1%26v2%3D0; AX_WAP-20480=INADAIAKFAAA; __utma=1.691665090.1392001243.1392001243.1392001243.1; __utmb=1.1.10.1392001243; __utmc=1; __utmz=1.1392001243.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)",
    "Host":"m.ctrip.com",
    "Origin":"http://m.ctrip.com",
    "Referer":"http://m.ctrip.com/html5/Hotel/",
    "User-Agent":"Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)",
    "X-Requested-With":"XMLHttpRequest"
    
};

//cookies
var cookie={};

//first send get request to m.ctrip.com/html5/Hotel/
var get_options = {
    headers:get_headers,
    method:'GET',
    hostname:'m.ctrip.com',
    path:'/html5/Hotel/'    
};
http.get(get_options, function(response){
    if(response.statusCode != 200)
    {
	console.log("failed to get package form google");
	return;
    }
    var strCookie = response.headers['set-cookie'];
    //console.log(strCookie instanceof Array);
    //for(var x in response.headers){
	//console.log(x+" : "+response.headers[x]);
    //}
    var cs = strCookie && strCookie[0].split(';');
    if(!cs){
	console.log("no set cookie found.");
	return;
    }
    for(var i=0;i<cs.length;i++){
	var idx = cs[i]&&cs[i].indexOf('=');
	if(idx>=0){
	    var key = cs[i].substr(0,idx);
	    var value = cs[i].substr(idx+1);
	    cookie[key] = value;
	    console.log("key:"+key);
	    console.log("value:"+value);
	}
    }
}).on('error', function(e) {
    console.log("Got error<getting packages>: " + e.message);
});

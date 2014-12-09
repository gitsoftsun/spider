var fs = require('fs')
var readline = require('readline');
var http = require('http')
var zlib = require('zlib')
var sprintf = require("sprintf-js").sprintf
var helper = require('../helpers/webhelper.js')
var url = "http://jing.58.com/adJump?adType=0&target=na33PWNOPjcOnHnzrjbYrjEdsA6YIZTlszqBpB3draOWUvYfXMK_IM-fIyGGIywGmy3fnHEkPHNQrHcvrjmLn1K3sMPCIAd_sjNYrjNYrjN&mobile=-1&useragent=&keywordtactics=0&utm_source=&spm=&isextend=0&disptime=1395224502533&entityid=14055192686730&entitytype=0&params=&local=1&cate=13915&JZEND=END";

//var data = fs.readFileSync("ctrip.hotels.list.html").toString();
//var cnf = data.match(/allRoom.+/)[0];
//var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
//console.log(url);

/*
http.get("http://www.sina.com.cn",function(res){
    console.log(res.statusCode);
    var t = setTimeout(function(){
	console.log("response timeout.");
	res.destroy();
    },100);
    console.log(t);
    var chunks = [];
    res.on('data',function(chunk){
	//console.log("get chunk.");
	chunks.push(chunk);
    });
    res.on('end',function(){
	console.log('request end');
	console.log(t);
	clearTimeout(t);
	//var buffer = Buffer.concat(chunks);
	//console.log(buffer.toString());
    });
});
*/
/*
var q = {"type":"old","pagesize":"50","index":"0"};
var opt = new helper.basic_options("www.jumeiglobal.com","/ajax_new/getDealsByPage",false,true,q);

helper.request_data(opt,null,function(data,args,res){
    console.log(JSON.stringify(data));
});*/


var i=7534;
function g(){
    helper.request_data("http://tuan.lefeng.com/bjsy/brand/"+i+".html",null,function(data,args,res){
	if(res.statusCode==200){
	    if(!data){
		//console.log("[ERROR] no data.");
	    }else{
		var matches = data.match(/\“([^”]+)\”/);
		var name = matches && matches.length>1 && matches[1];
		if(name){
		    console.log("%d\t%s",args[0],name);
		}
	    }
	}
	i++;
	g();
    },i);
}

g();
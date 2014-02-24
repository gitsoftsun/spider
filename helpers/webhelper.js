var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var $ = require('jquery')
exports.toQuery = function(obj){
    var sb = new exports.StringBuffer();
    sb.append('?');
    for(var k in obj){
        sb.append(k);
        sb.append('=');
        sb.append(encodeURIComponent(obj[k]));
        sb.append('&');
    }
    sb.removeLast();
    return sb.toString();
}
exports.basic_options=function(host,path,method,isApp,isAjax,data,port){
    this.path=path||'/';
    this.host=host||'m.ctrip.com';
    this.port=port||80;
    this.method=method||'GET';
	this.data = data||{};
    this.headers={
        "Accept":"text/html,application/xhtml+xml,application/xml,application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding":"gzip, deflate",
        "Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
        "X_FORWARDED_FOR":"58.99.128.66"
    };
    if(method=="POST")
	   this.headers["Content-Type"] = "application/json";
    if(method=="GET"&&data&&data instanceof Object){
        var sb = new exports.StringBuffer();
        sb.append('?');
        for(var k in data){
            sb.append(k);
            sb.append('=');
            sb.append(encodeURIComponent(data[k]));
            sb.append('&');
        }
        sb.removeLast();
        this.path+=(sb.toString());
        sb=null;
    }

    if(isApp){
	this.headers['User-Agent']= 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)';
    }
    else
	this.headers['User-Agent'] = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36";
    if(isAjax)
	this.headers["X-Requested-With"]="XMLHttpRequest";
};

exports.CtripUnPack = function(e){
    var q = "return o;";
    for (var u = [], f = [], i = e[0], n = i.length, l = e.length, x = -1, A = -1, a = 0, p = 0, d, o; a < n; ++a) {
        f[++A] = i[a];
        if (typeof i[a + 1] == "object") {
            ++a;
            for (d = 1; d < l; ++d) {
                o = e[d];
                o[p] = i[a][o[p]]
            }
        }
        ++p
    }
    for (var k = 1; k < l; ++k)
        for (var g = e[k], c = 0; c < f.length; c++)
            if (typeof g[c] == "object")
                if (g[c] && g[c].length > 0) {
                    for (var t = [], h = [], s = g[c][0], m = s.length, v = g[c].length, w = -1, y = -1, b = 0, z = 0, j; b < m; ++b) {
                        h[++y] = s[b];
                        ++z
                    }
                    for (b = 0, m = h.length; b < m; ++b)
                        h[b] = 'o["'.concat(h[b].replace('"', "\\x22"), '"]=a[', b, "];");
                    var r = Function("o,a", h.join("") + q);
                    for (j = 1; j < v; ++j)
                        t[++w] = r({}, g[c][j]);
                    e[k][c] = t
                }
    for (a = 0, n = f.length; a < n; ++a)
        f[a] = 'o["'.concat(f[a].replace('"', "\\x22"), '"]=a[', a, "];");
    var r = Function("o,a", f.join("") + q);
    for (d = 1; d < l; ++d)
        u[++x] = r({}, e[d]);
    return u
}

exports.StringBuffer = function(){
    this.data=[];
}
exports.StringBuffer.prototype.append=function(){
    this.data.push(arguments[0]);
    return this;
}
exports.StringBuffer.prototype.toString=function(spliter){
    return this.data.join(spliter||"");
}
exports.StringBuffer.prototype.clear = function(){
    this.data=[];
}
exports.StringBuffer.prototype.removeLast = function(){
    var result = this.data.length>0 && this.data.splice(-1,1);
    return result;
}


exports.request_data=function(opts,data,fn,args){
    if(!opts || !fn) throw "argument null 'opt' or 'data'";
    var strData = data && JSON.stringify(data);
    if(opts.method=='POST')
        opts.headers['Content-Length']=Buffer.byteLength(strData);
    
    var req = http.request(opts, function(res) {

    var chunks=[];
    res.on('data', function (chunk) {
            chunks.push(chunk);
    });
    res.on('end',function(){
            if(res.headers['content-encoding']=='gzip'){
        var buffer = Buffer.concat(chunks);
		if(buffer.length==157){
			console.log("current ip has been forbidden.");
            
            //process.exit();
		}
        zlib.gunzip(buffer,function(err,decoded){
            if(decoded){
            try{
                var obj = decoded.toString();
                if(res.headers['content-type'].indexOf('application/json')!=-1)
                    obj =JSON.parse(decoded.toString());
				if(Array.isArray(args)){
					args.push(opts.data);
					fn(obj,args);
				}else{
					fn(obj,[args,opts.data]);
				}
                
            }
            catch(e){
                console.log(e.message);
                
            }
            }
        });
            }
            else if(res.headers['content-encoding']=='deflate'){
      var buffer = Buffer.concat(chunks);
      zlib.inflate(buffer,function(err,decoded){
        console.log(decoded&&decoded.toString());
      });
    }
    });
    });
    req.on('error', function(e) {
	if(opts.path && opts.path.indexOf('list.jsp')!=-1){
		console.log("page :"+opts.data.pageNum+"got error-"+e.message);
		fs.appendFile("app_qunar_hotel_failed.txt","p:"+ JSON.stringify(opts.data)+'\r\n');
	}else{
		console.log("page of hotel:"+opts.data.seq+" got error-"+e.message);
		fs.appendFile("app_qunar_hotel_failed.txt","h:"+JSON.stringify(opts.data)+'\r\n');
	}
    //console.log(e.message);
	//var proxy = exports.randomip(proxys);
    //            if(proxy.host&&proxy.port){
    //                opts.port = proxy.port;
    //                opts.host = proxy.host;    
    //            }
                
                //retry
                exports.request_data(opts,data,fn,args);
    });
    if(opts.method=='POST')
        req.write(strData);
    req.end();
}

exports.get_cities = function(filename){
    if(!fs.existsSync(filename)) {
        console.log("file not found: "+filename);
        return;
    }
    
    var lines = fs.readFileSync(filename).toString().split('\r\n');
    if(!lines){
        console.log("there are no cities in file: "+lines);
        return;
    }

    var cities = [];
    for(var i=0;i<lines.length;i++){
	if(!lines[i]) continue;
      var c = lines[i].split(' ');

      var city = {};
      city["code"] = c[2];
      city["cname"] = c[1];
      city["id"] = c[0].match(/\d+/)[0];
      city["pinyin"] = c[0].match(/[a-zA-Z]+/)[0];
      cities.push(city);
    }
    return cities;
}


exports.verifyproxy = function(filename,outfile){
    if(!filename||!outfile) return;
    if(!fs.existsSync(filename)){
	console.log("proxy file not found: "+finename);
	return;
    }
    var lines = fs.readFileSync(filename).toString().split('\r\n');
    if(!lines) return;
    var result = [];
    for(var i=0;i<lines.length;i++){
	var l = lines[i].split(':');
	var host = l[0];
	var port = l[1];
	verifyip(host,port,outfile);
    }
}

function verifyip(host,port,output){
    if(!host||!port||!output) return;
    http.get({'host':host,'port':port,'path':'http://www.baidu.com'},function(res){
        var chunks = [];
        res.on('data',function(chunk){
            chunks.push(chunk);
        });
        res.on('end',function(){
            var buffer = Buffer.concat(chunks);
            zlib.gunzip(buffer,function(err,decoded){
				if(decoded){
					var obj = decoded.toString();
					if(obj.indexOf('030173')>-1){
						console.log(host+":"+port);
						fs.appendFile(output,host+":"+port+'\r\n',function(err){
							if(err) console.log(err.message);
						});
					}
				}
            });
			
        });
    }).on('error',function(e){
        //console.log("Got error: "+e.message);
    });
}

exports.proxy = function(){
	this.proxyList = [];
	this.curIdx = -1;
}

exports.proxy.prototype.load = function(filename){
    if(!fs.existsSync(filename)) {
        console.log("file not found:"+filename);
        return;
    }
	var lines = fs.readFileSync(filename).toString().split('\r\n');
    this.proxyList = lines.map(function(l){
        var str = l.split(':');
        return {'host':str[0],'port':str[1]};
    });
	this.curIdx = 0;
}

exports.proxy.prototype.randomip=function(){
  var idx = Math.random()*(this.proxyList.length);
  idx = parseInt(idx);
  return proxys[idx];
}

exports.proxy.prototype.getNext = function(){
	if(this.curIdx == this.proxyList.length-1){
		this.curIdx=0;
	}else{
		this.curIdx++;
	}
	return this.proxyList[this.curIdx];
}
exports.proxy.prototype.cur = function(){
	if(this.proxyList.length>0)
		return this.proxyList[this.curIdx];
	else
		return null;
}

exports.fetchProxys=function(){
    var proxySites = [];
    proxySites.push('http://www.proxy360.cn/Proxy');
    proxySites.push('http://www.cnproxy.com/proxy1.html');
    
	http.get(proxySites[0],function(res){
	    var str ='';
	    res.on('data',function(chunk){
		str+=chunk;
	    });
	    res.on('end',function(){
		var sb = new exports.StringBuffer();
		var doc = $(str);
		var itemNodes = doc.find("div.proxylistitem");
		itemNodes.each(function(idx,items){
		var item = items.children[0];
			var ip = item.children[0].innerHTML.trim();
			var port = item.children[1].innerHTML.trim();
			sb.append(ip);
			sb.append(":");
			sb.append(port);
			sb.append('\r\n');
		});
		sb.removeLast();
		var date  =new Date();
		fs.appendFileSync("proxys-"+(date.getMonth()+1)+"-"+date.getDate()+".txt",sb.toString());
	    });
	});
	
	// http.get(proxySites[1],function(res){
	// 	var str ='';
	//     res.on('data',function(chunk){
	// 	str+=chunk;
	//     });
	//     res.on('end',function(){
        
	// 	var sb = new exports.StringBuffer();
	// 	var doc = $(str);
	// 	var itemNodes = doc.find("#proxylisttb");
 //        if(itemNodes.length==0)
 //            return;
 //        var table = itemNodes[0].children[2];
 //        var trs = table.getElementsByTagName("tr");
 //        console.log(trs[1].innerHTML);
 //        for(var k=1;k<trs.length;k++){
 //            var td = trs[k].children[0];
 //            console.log(td.innerHTML);
 //            sb.append(td.childNodes[0].value.trim()+td.childNodes[2].value.trim());
 //            sb.append('\r\n');
 //        }
 //        sb.removeLast();
 //        var date = new Date();
 //        fs.writeFileSync("proxys-"+(date.getMonth()+1)+"-"+date.getDate()+".txt",sb.toString());
	//     });
	// });

}
//var proxys = exports.get_proxy('avaliable_proxy6.txt');

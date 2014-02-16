var http = require('http')
var zlib = require('zlib')

exports.basic_options=function(host,path,method,isApp,isAjax,data){
    this.path=path||'/';
    this.host=host||'m.ctrip.com';
    this.port=80;
    this.method=method||'GET';
    this.headers={
        "Accept":"application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding":"gzip, deflate",
        "Accept-Language":"en-US,en;q=0.8,zh-Hans-CN;q=0.5,zh-Hans;q=0.3",
        "X_FORWARDED_FOR":"58.99.128.66"
    };
    if(method=="POST")
	   this.headers["Content-Type"] = "application/json";
    if(method=="GET"&&data instanceof Object){
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
        zlib.gunzip(buffer,function(err,decoded){
            if(decoded){
            try{
                var obj = decoded.toString();
                if(res.headers['content-type'].indexOf('application/json')!=-1)
                    obj =JSON.parse(decoded.toString());
                fn(obj,args);
            }
            catch(e){
                console.log(e.message);
                //retry once.
               // setTimeout(function(){
            //  request_data(opts,data,fn,args);        
              //  },2000);
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
    console.log('problem with request: ' + e.message);
    });
    if(opts.method=='POST')
        req.write(strData);
    req.end();
}
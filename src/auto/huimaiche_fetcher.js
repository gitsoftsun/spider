var http = require('http');
var cheerio = require('cheerio');

function download(url, callback) {
    http.get(url, function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
	});
        res.on('end', function() {
            callback(data);
	});
    }).on('error', function() {
        callback(null);
    });
}

function getData(data) {
    $ = cheerio.load(data);
    var k = $('p.topp strong').text();
    console.log(k);
    var now = new Date();
    var mn = now.getMonth() + 1;
    var t = now.getFullYear() + '-' + mn + '-' + now.getDate();
    var o = t + '\t' + k + '\n';
    var fs = require('fs'); 
    fs.appendFileSync('/home/bda/Projects/spider/result/huimaiche.txt', o, 'utf8');
}

download('http://beijing.huimaiche.com', getData);

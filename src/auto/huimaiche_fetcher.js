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
    var k = $('strong').html();
    console.log(k);
    var now = new Date();
    var t = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
    var o = t + '\t' + k + '\n';
    var fs = require('fs'); 
    fs.appendFile('/home/bda/Projects/spider/result/huimaiche.txt', o, 'utf8', function(err) {
        if (err) {
            console.log(err);
	}
    });
}

download('http://beijing.huimaiche.com', getData);

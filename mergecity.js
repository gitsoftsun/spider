var fs = require('fs')

var lines = fs.readFileSync("flight_city.txt").toString().split('\r\n');
var pys = fs.readFileSync("ctrip_city.txt").toString().split('\r\n');

var cities={};

for(var j=0;j<pys.length;j++){
    var ps = pys[j].split(' ');
    var k = ps[1];
    var py = ps[0];
    cities[k] = py;
}
for(var i=0;i<lines.length;i++){
    var l = lines[i];
    var data = l.split('|');
    var c = data[1].replace(/\(w+\)/,'');
    
    fs.appendFileSync("citycode.txt",cities[c]+' '+c+' '+data[2]+'\r\n');
}

var fs = require("fs");

fs.appendFile('../result/yichemall.txt', "hello ", function(err){
	if(err) throw err;
	console.log('has finished');
});

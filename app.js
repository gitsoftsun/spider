var fs = require('fs')

/*
Check if there is result dir.
 */
if(!fs.exsitsSync('result')){
    fs.mkdirSync('result');
}



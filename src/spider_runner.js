var exec = require('child_process').exec;

//var spider_file = 'dp_tiny_hotpot.js 1 300';
//var spider_file = 'dp_get_city.js';
var spider_file = 'dp_tuan_num.js';
//var spider_file = 'dp_tuan_products.js';
var goon = true;

var run_spider = function(){
    var spider = exec('node ' + spider_file); 

    spider.stdout.on('data', function (data) { 
        console.log(data); 
        var data_arr = data.split('\n');
        var data_arr_len = data_arr.length;
        for(var i in data_arr){
            var data = data_arr[i];
            if(data == 'ok')
            {
                goon = false;
                return;
            }
        }
        
    }); 

    spider.on('exit', function (code) { 
        console.log('process exit(%d)!!!', code);
        if(goon)
        {
            setTimeout(function () {
                run_spider();
            }, 2000);
        } 
    }); 
}

run_spider();

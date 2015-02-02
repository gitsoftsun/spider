var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var Crawler = require('crawler')
var url = require('url')

var index = 0;
var pagesize=50;
var d = new Date().toString();
var resultFile = "../result/jumeiglobal.txt";
var resultCountFile = "../result/jumeiglobal_count.txt";

var c = new Crawler({
    maxConnections:2,
    callback:function(error,result,$){
	var num = $("em.get_people").text();
	var id = $("#hid_hashid").val();
	if(!id){
	    try{
		id=url.parse(result.uri,true).query.hash_id;
		id = id || url.parse(result.uri).pathname.match(/(\w+)\.html/)[1];
	    }catch(e){
		console.log(e);
	    }
	}
	var r = d+"\t"+id+"\t"+num+'\n';
	console.log(r);
	fs.appendFileSync(resultCountFile,r);
    }
});

function wgetList(idx,type){
    var q = {"type":type,"pagesize":pagesize,"index":idx};
    var opt = new helper.basic_options("www.jumeiglobal.com","/ajax_new/getDealsByPage","GET",false,true,q);
    console.log("[GET ] %d",idx);
    helper.request_data(opt,null,function(data,args,res){
	process(data,args,res);
    });
}

function process(data,args,res){
    if(!data){
	console.log("[ERROR] data empty.");
	wgetList(args[0]);
	return;
    }
    if(data.message!="success"){
	console.log("[ERROR] %s",data.message);
	wgetList(args[0]);
	return;
    }
    console.log("[DATA] list count: %d",data.list.length);
    var records=[];
    var first = "";
    if(!fs.existsSync(resultFile)){
	first = ["日期","标题","原文标题","国外价","人民币","大陆参考价","折扣","品牌ID","商品ID"].join('\t');
    }
    records.push(first);
    data.list.forEach(function(li){
	var r = [d,li.pro_stitle,li.pro_foreign_name,li.area_name.currency_symbol+""+li.price_foreign,li.price_home,li.price_ref,li.discount,li.brand_id,li.hash_id].join('\t');
	c.queue(li.url);
	console.log(li.url);
	records.push(r);
    });
    fs.appendFileSync(resultFile,records.join("\n"));
    if(data.end){
	if(args[0].type=="new"){
	    wgetList(0,"old");
	}else{
	    console.log("[DONE] job done.");
	}
    }else{
	wgetList(args[0].index+pagesize);
    }
}
wgetList(0,"new");
//{"image":{"pro_from":"http://p1.global.jmstatic.com/banner/area/000/000/029_big.jpg","pro_pic":"http://p1.global.jmstatic.com/product/001/021/1021485_std/1021485_350_350.jpg","pro_def":"http://p1.global.jmstatic.com/product/001/021/1021485_std/1021485_dx_640_400.jpg","pro_logo":"http://p1.global.jmstatic.com/brand/logo_180/71.jpg"},"diff":233480,"pro_status":1,"is_post":1,"end_time_string":"<em>04日</em><em>09</em>时<em>59</em>分<em>59</em>秒","url":"http://www.jumeiglobal.com/deal/ht141201p1021485t1.html?from=jmglobal","pro_stitle":"雅诗兰黛鲜亮焕采精粹水(滋润型)","pro_foreign_name":"Estée Lauder Nutritious Radiant Vitality Energy Lotion","medium_name":"回复最初的内在健康，焕活鲜亮光采，雅诗兰黛鲜亮焕采精粹水(滋润型)200ml。","price_foreign":57.0266,"price_home":349,"price_abroad":"55.00","price_ref":429,"discount":8.1,"area_name":{"rate":"16.3400","currency_symbol":"$","currency_symbol_location":"1","currency_name":"美金","area_code":"19","area_rate_id":"1","area_exchange_rate":0.1634,"area_currency_symbol":"$","area_currency_symbol_location":"1","area_name":"美金"},"area_code":"29","with_new_image":"1","brand_id":"71","hash_id":"ht141201p1021485t1","end_time":"1417658399","baoyou":"299.00","preferential":""}
var fs = require('fs')
//var helper = require('../helpers/webhelper.js')
var Crawler = require("crawler")
//var util = require("util")
//var iconv = require("iconv-lite")
var c = new Crawler({
    maxConnections:10
    ,callback:processUrls
});
var page_index = 1;
var p_url = "";
var current_time = new Date();
var month = current_time.getMonth()+1;
var date_str = current_time.getFullYear()+"_"+month+"_"+current_time.getDate();
var resultFile = "../result/qfang/js_qfang_"+date_str+".txt";

//*error 参数：判断url合法的吗？ 这个函数主要处理url获取ids*/
function processUrls(error, result, $){
	console.log(result.uri+ " starting!")
	if(error){
		console.log(error);
		// c.queue(result.uri);
		return;
    }
    if(!$){
		return;
    }
	var ids_list = new Array();
	var is_Today = 0;
	// var is_f = true;
	// while(is_Today == 0){
	// if (!is_f){
		
		// if (index < max_Page) {
		// };
	// c.queue(p_url)
	// }
	/*计算最大页数*/
	// if (max_Page == 0) {
	// 	$(".turnpage_num a").each(function(){
	// 		var temp = $(this).attr("href");
	// 		if (max_Page < parseInt(temp)) {
	// 			max_Page = parseInt(temp);
	// 			console.log(max_Page)
	// 		};
	// 	})
	// is_f = false;	
	// };
	// console.log("-------Max_page is : "+max_Page)
	$(".cycle-listings li").each(function(){
		var part_Url = $("p a", this).attr("href");
		// console.log("part_Url :"+part_Url);
		var temp_arr = String(part_Url).split("/"); //index:2 对应house_sale_id
		// console.log("temp_arr[2] : "+temp_arr[2])
		var update_str = $(".listings-item-bottom p", this).text();
		update_str = String(update_str).replace(/\s/g, ""); //去掉span标签中的内容
		console.log("update_str : "+update_str);
		entity = ""//存放一条记录
		if (String(update_str).search("分钟") != -1) {
			entity = temp_arr[2];
		}else if (String(update_str).search("小时") != -1) {
			update_hour = parseInt(String(update_str).match(/\d+/g));
			current_hour = new Date().getHours()
			console.log("update_hour: "+update_hour+", current_hour :"+current_hour)
			if (parseInt(current_hour) - update_hour > 0) {
				entity = temp_arr[2];
			}else{
				is_Today = -1;
				// break;
			}
		}else{
			is_Today = -1;
			// break;
		}
		// console.log("entity is : "+entity)
		if (String(entity).length != 0) {
			ids_list.push(entity);
			// console.log("Length : "+ids_list.length);
		};
	})
	/*组装url并调用 processBrokerInfo*/
	for (var i = 0; i < ids_list.length; i++) {
		//去掉/f***
		var temp_url = "";
		var index = String(result.uri).search(/f\d+/g);
		if (index != -1) {
			temp_url = String(result.uri).substring(0, index);
		};
		var detail_url =  temp_url + ids_list[i];
		// console.log("detail_url : ", detail_url);
		c.queue({uri:detail_url, callback:processBrokerInfo});
	}
	if (is_Today == 0) {
		// if(String(p_url).search(/\/f\d/) != -1){
		// 	p_url = String(result.uri).replace(0, String(result.uri).search(/\d+/)) + (++page_index);	
		// }else{
		// 	p_url = result.uri+"/f"+(++page_index);
		// }
		next_url = $(".turnpage_next").attr("href");
		console.log("next url : "+next_url);
		p_url = String(result.uri).substring(0, String(result.uri).search(/\/sale/g))+next_url;
		// console.log("p_url is : "+p_url);
		c.queue({uri: p_url, callback:processUrls});
	}
	return;
	// }
	// return ids_list;
}

//*抓取需要信息*/
function processBrokerInfo(error, result, $){
	
	if (error) {
		console.log(error);
		return;
	};
	if (!$) {
		return;
	};
	var house_id = $(".house_number span").text();
	var broker_name = $(".broker_basic_name").text();
	var broker_tel = $(".mtel_num").text();
	var release_time = $(".release_time").text();
	var store_add = ""
	$(".store_info").each(function(){
		var temp = $(this).text();
		store_add = store_add+temp;
	})
	//保存这些字段
	var entity = [""];
	var sale_id = String(result.uri).substring(String(result.uri).search(/\d+/g))
	entity.push([sale_id, house_id, broker_name, broker_tel, release_time, store_add, date_str].join("\t"));
	// console.log(entity);
	fs.appendFileSync(resultFile,entity.join("\n"));


}

/*开启线程之后开始执行默认的callback函数*/
c.queue("http://shenzhen.qfang.com/sale/");
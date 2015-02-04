/*处理点评旅游的deal list*/
var fs = require('fs');
var t_dp_url = "http://t.dianping.com";
var Crawler = require('crawler');

var c = new Crawler({
	maxConnections:1,
	callback: processUrls
});

/*获取分类url并放入队列*/
function processUrls(error, result, $){
	if (error) {
		console.log(error);
	};
	if (!$) {
		return;
	};
	$()
	return;
}
/*抓取信息内容*/
function processListInfo(error, result, $){
	return;
}

/*依次读入每个城市， 城市之间停顿一秒（？）*/
var read_path = "../appdata/dp_city.txt";
var city_codes = fs.readFileSync(read_path, "utf-8");
var citys = String(city_codes).split(/\n/);
for (var i =0; i < citys.length; i++){
	// console.log(citys[i]);
	city_info = String(citys[i]).split(",");
	city_code = city_info[0];
	city_py = city_info[1];
	city_name = city_info[2];
	city_url = t_dp_url+"/travel/"+city_py+"-category_6";
	console.log("city_url is : "+city_url);
	c.queue(city_url);

}



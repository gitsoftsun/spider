# coding:utf8

import urllib2
import json
from pyquery import PyQuery as pq

URL = 'http://beijing.huimaiche.com/shangou/list'
urlp1 = 'http://ajax.huimaiche.com/RapidIndexCars.ashx?v=1422431019054&callback=jQuery11100478390209376812_1422431017426&ccode='
urlp2 = '&top=1000&all=1&callback=%24.brand_oneprice.loaders.rapidCarskLoader._carsCb&_=1422431017427'



def get_city_urls():
    print "get city urls"
    html = urllib2.urlopen(URL).read()
    htmlPq = pq(html)(".change-city li a");
    fw = open('../result/urls.txt', 'w+')
    for i in range(0, len(htmlPq)):
        url = htmlPq.eq(i).attr['href']
        cname = htmlPq.eq(i).text()
        entity = cname + ',' + url + '\n'
        fw.write(entity.encode('utf8'))
    fw.close()
    print "get city_url done"


def get_city_code():
    fr = open('../result/urls.txt', 'r')
    urls = []
    for line in fr:
        (name, url) = line.strip().split(',')
        print name + 'processing'
        try:
            html_content = urllib2.urlopen(url).read()
        except urllib2.URLError, e:
            e.reason
        str_html = str(html_content)
        ccode_index = str_html.index('ccode:', 0, len(str_html))
        city_code_str = str_html[ccode_index+6: ccode_index+10]
        if ',' in city_code_str:
            city_code_str = city_code_str.strip(',')
        # print city_code_str
        url_t = urlp1 + city_code_str.strip()+urlp2
        urls.append(url_t)
    fr.close()
    return urls


def get_info(urls):
    print "process car info"
    fw = open('../result/auto/yiche_shangou.txt', 'w+')
    for url in urls:
        try:
            js_text = urllib2.urlopen(url).read()
        except urllib2.URLError, e:
            print e.reason
        json_string = js_text[int(str(js_text).index("_carsCb(["))+8:len(js_text)-4]
        
        data = json.loads(json_string)
        # print data
        for car_info in data:
                entity = car_info['SaleCity'].encode('utf8') +"\t"+car_info['CarYear'].encode('utf8') +"\t"+car_info['CsName'].encode('utf8') +"\t"+car_info['CarName'].encode('utf8') +"\t"+str(car_info['Stock']) +"\t"+car_info['RapidPrice'].encode('utf8') +"\t"+car_info['ReferPrice'].encode('utf8') +"\t"+car_info['CurTime'].encode('utf8') +"\t"+str(car_info['TimeType']) +"\t"+car_info['MaxSave'].encode('utf8') +"\t"+str(car_info['Buyer']) +"\n"
                fw.write(entity)
    fw.close()
    print "DONCD"

def main():
    get_city_urls()
    get_info(get_city_code())


if __name__ == "__main__":
    main()

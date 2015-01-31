#coding:utf8

import urllib2
import json
import os

def   get_info(urls):
    print os.getcwd()
    fw = open('../result/auto/yiche_shangou.txt', 'w+')
    for url in urls:
        js_text = urllib2.urlopen(url).read()
        json_string = js_text[int(str(js_text).index("_carsCb(["))+8:len(js_text)-4]
        
        data = json.loads(json_string)
        # print data
        for car_info in data:
                entity = car_info['SaleCity'].encode('utf8') +"\t"+car_info['CarYear'].encode('utf8') +"\t"+car_info['CsName'].encode('utf8') +"\t"+car_info['CarName'].encode('utf8') +"\t"+str(car_info['Stock']) +"\t"+car_info['RapidPrice'].encode('utf8') +"\t"+car_info['ReferPrice'].encode('utf8') +"\t"+car_info['CurTime'].encode('utf8') +"\t"+str(car_info['TimeType']) +"\t"+car_info['MaxSave'].encode('utf8') +"\t"+str(car_info['Buyer']) +"\n"
                fw.write(entity)
    fw.close()


def  main():
    bjurl = 'http://ajax.huimaiche.com/RapidIndexCars.ashx?v=1422431019054&callback=jQuery11100478390209376812_1422431017426&ccode=201&top=1000&all=1&callback=%24.brand_oneprice.loaders.rapidCarskLoader._carsCb&_=1422431017427'
    gzurl = 'http://ajax.huimaiche.com/RapidIndexCars.ashx?v=1422438067183&callback=jQuery11100259428184479475_1422438064293&ccode=501&top=1000&all=1&callback=%24.brand_oneprice.loaders.rapidCarskLoader._carsCb&_=1422438064295'
    whurl = 'http://ajax.huimaiche.com/RapidIndexCars.ashx?v=1422438112250&callback=jQuery111005999405172187835_1422438111324&ccode=1201&top=1000&all=1&callback=%24.brand_oneprice.loaders.rapidCarskLoader._carsCb&_=1422438111326'
    cdurl ='http://ajax.huimaiche.com/RapidIndexCars.ashx?v=1422438137366&callback=jQuery111009785614341963083_1422438136155&ccode=2501&top=1000&all=1&callback=%24.brand_oneprice.loaders.rapidCarskLoader._carsCb&_=1422438136156'
    urls = [bjurl, gzurl, whurl, cdurl]
    get_info(urls)

if __name__ == "__main__":
    main()

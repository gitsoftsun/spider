# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
import time
from pyquery import PyQuery as pq
import chardet
import json


def process_info(car_url):
    """

    :return:
    """
    car_request = urllib2.Request(car_url, headers={})
    try:
        car_page = urllib2.urlopen(car_request)
        print "car statue code :"+str(car_page.getcode())
        car_html = car_page.read()
    except urllib2.URLError, e:
        print e.reason
        car_html = urllib2.urlopen(car_request).read()
    process_detail_info(car_html)
    car_pq = pq(car_html)('.the_pages a')
    for i in range(0, len(car_pq)):
        if car_pq.eq(-1).text() == '下一页':
            url_p = r'http://car.bitauto.com/langdong/m105935/baojia/c0/'
            url_page = car_pq.eq(-1).attr['href']
            url = url_p + url_page
            process_info(url)
        else:
            return


def process_detail_info(html_content):
    """
    抓取详细的
    :return:
    """
    reference_price = pq(html_content)('.card-tit strong').text()
    html_obj = pq(html_content)('.jxs-list .clearfix')
    for i in range(0, len(html_obj)):
        html_index = html_obj.eq(i)
        shop_name = html_index('.intro-box .p-tit a').text()
        shop_sales_promotion = html_index('.p-intro:first a').text()
        shop_adr = html_index('.p-intro .add-sty').text()
        shop_adr = str(shop_adr).strip().decode(chardet.detect(str(shop_adr))['encoding'])[0: -4].encode('utf-8')
        shop_tel_fade = html_index('.p-intro input:hidden').attr['value']
        tel_url = 'http://autocall.bitauto.com/eil/das2.ashx?userid='+str(shop_tel_fade).strip()+'&mediaid=10&source=bitauto'
        shop_tel_json = str(urllib2.urlopen(tel_url).read())
        shop_tel_json = shop_tel_json[shop_tel_json.index('['): shop_tel_json.index(']')+1]
        if not len(shop_tel_json) == 2:
            shop_tel = json.loads(shop_tel_json)[0]['tel']
        else:
            shop_tel = '400-000-0000'
        shop_tel = str(shop_tel).strip()
        shop_advice_price = html_index('.infor-box .price-main a').text()
        shop_area = html_index('.price-city').text()
        entity = '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' % (reference_price, shop_name, shop_advice_price, shop_sales_promotion,
                                                   shop_adr, shop_tel, shop_area, time_str)
        print car_info + entity
        fw.write(car_info + entity)


def main():
    """
    MAIN
    :return:
    """
    output_path = '../result/auto/yiche_cars_'+time_str+'.txt'
    fr = open('../result/auto/yiche_urls.txt', 'r')
    global fw
    fw = open(output_path, 'w+')
    title = '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' % ('品牌', '车型', '配置', '厂商指导价', '参考成交价', '店名', '店内价格',
                                                                  '促销', '地址', '电话', '售卖地区', '抓取时间')
    fw.write(title)
    for line in fr:
        if isinstance(line, str):
            line = line.decode(chardet.detect(line)['encoding']).encode('utf-8')
        (car_brand, car_type, car_config, Price, car_url) = line.strip().split('\t')
        print "car_brand :"+car_brand+"car_url"+car_url
        global car_info
        car_info = '%s\t%s\t%s\t%s\t' % (car_brand, car_type, car_config, Price)
        process_info(car_url)
    fr.close()
    fw.close()

if __name__ == "__main__":
    time_str = time.strftime('%Y-%m-%d', time.localtime(time.time()))
    main()
# -*- coding: utf-8 -*-
__author__ = 'User19'

import urllib2
import random
import json

ajax_header = {'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)', 'x-requested-with': 'XMLHttpRequest','Accept-Language': 'zh-cn','Referer': 'http://ird.itracker.cn/login.aspx?ULogin=6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrLcDZXVAtLxvOMsH9608oV135EnqFsKgE7sNHNUm24xstgYG%2FUf7%2Fh695Dyolx2vjabzHTXDjSWooCvb9HxZkYM%3D&UTYPE=login','Accept': 'application/json, text/javascript, */*','Content-Type': 'application/x-www-form-urlencoded','Accept-Encoding': 'gzip, deflate','Host': 'ird.itracker.cn','Connection': 'Keep-Alive','Cookie': '_pk_id.5.0287=da1261a75bb71353.1423456036.2.1423465754.1423456350.; _pk_ses.5.0287=*; ASP.NET_SessionId=scovwxwug1mxxxv4bur3lbsc; language=1'}


def get_login_state():
    """
    得到json 并解析json
    :return: login-status
    """
    ajax_url_p = r'http://ird.itracker.cn/Ajax/index.ashx?_=1423466207333&info=6ELy68eiudh3y13jUab2I03ptJN8%2BOlN0ZdD%2Bh674qbezAQSZ%2FOYShAt7wVj64FtM5b%2B1hehgMWT21j2BGrmrLcDZXVAtLxvOMsH9608oV135EnqFsKgE7sNHNUm24xstgYG%2FUf7%2Fh695Dyolx2vjabzHTXDjSWooCvb9HxZkYM%3D&page=index&m='
    ran_f = '%.16f' % random.random()
    ran = str(ran_f)
    ajax_url = ajax_url_p+ran
    print ajax_url
    ajax_request = urllib2.Request(ajax_url, headers=ajax_header)
    http_handler = urllib2.HTTPHandler(debuglevel=1)
    https_handler = urllib2.HTTPSHandler(debuglevel=1)
    opener = urllib2.build_opener(http_handler, https_handler)
    urllib2.install_opener(opener)
    json_content = urllib2.urlopen(ajax_request).read()
    print urllib2.urlopen(ajax_request).getcode()
    print json_content
    json_obj = json.loads(json_content)
    login_status = json_obj['LoginStatus'][0]['state']
    print login_status

def main():
    """
    Main Method
    :return:
    """
    # login()
    get_login_state()


if __name__ == '__main__':
    main()
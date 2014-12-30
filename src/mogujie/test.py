import urllib2
import time
import random
import httplib2

for i in range(100):
    print i
    url = "http://www.mogujie.com/book/clothing/16125/%d" % i
    req = urllib2.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36")
    html = urllib2.urlopen(req).read()
    print html[:100]
    time.sleep(1+random.random())

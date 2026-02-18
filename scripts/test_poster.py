#!/usr/bin/env python3
import time, random, requests
url='http://localhost:5000/ph'
for i in range(5):
    ph=round(6.5+random.random()*1.5,2)
    ts=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    payload={'ph':ph,'timestamp':ts}
    r=requests.post(url,json=payload)
    print('posted', payload, '->', r.status_code)
    time.sleep(1)
print('GET last ->', requests.get('http://localhost:5000/ph/last').text)

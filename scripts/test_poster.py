#!/usr/bin/env python3
import time, random, requests
url='http://localhost:5000/api/sensors'
for i in range(5):
    ph=round(6.5+random.random()*1.5,2)
    temperature=round(20+random.random()*8,2)
    tds=round(350+random.random()*300,2)
    ec=round(0.5+random.random()*1.0,3)
    ts=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    payload={'ph':ph,'temperature':temperature,'tds':tds,'ec':ec,'timestamp':ts}
    r=requests.post(url,json=payload)
    print('posted', payload, '->', r.status_code)
    time.sleep(1)
print('GET last ->', requests.get('http://localhost:5000/api/sensors/last').text)

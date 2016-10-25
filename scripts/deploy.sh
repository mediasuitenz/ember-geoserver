#!/bin/bash
ember build --environment=production
tar czf dist.tar.gz dist
echo 'zipped'
scp dist.tar.gz geoserver-test:~
echo 'sent to server'
ssh geoserver-test tar xf dist.tar.gz
echo 'unpacked on server'
ssh geoserver-test sudo mv dist/ /home/jetty/ember-geoserver
echo 'deployed to jetty'
rm dist.tar.gz
echo "cleaned up and finished without error"

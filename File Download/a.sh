aria2c  --file-allocation=none  -x 4 a.com
echo $? >> res.txt

aria2c  --file-allocation=none  -x 4 d.com
echo $? >> res.txt


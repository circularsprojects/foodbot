> [!IMPORTANT]
> foodbot (javascript) is no longer updated or maintained, check out the swift rewrite instead: https://github.com/circularsprojects/foodbot-swift
# foodbot (v3 rewrite)
a discord bot that posts food
# important information
- you need to setup a .env file
```
TOKEN=
TEST_GUILD_ID= [optional]
INFLUXDBTOKEN=
INFLUXDBURL
```
## v3 information
so i just rewrote the whole thing using a funny template so that it would actually work because in v2 it would just crash after a while and i have no clue why
### currently at ~500 servers
## InfluxDB
this bot now uses influxdb for analytics!\
you'll need to configure a url and token yourself in the .env file, and if you want to disable analytics, just delete any code relating to influxdb from index.js (i have not made an easy way to turn it off yet)

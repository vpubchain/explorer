var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request')
  , Reader = require('@maxmind/geoip2-node').Reader;

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    lib.sendMail(settings.email_receiver, "监管平台系统告警", "mongodb异常，请检查");
    return;
    //exit();
  } else {
    request({uri: 'http://127.0.0.1:3001/api/masternodelist', json: true}, function (error, response, nodes) {
      if( error || nodes == "There was an error. Check your console."){
        // lib.sendMail(settings.email_receiver, "监管平台系统告警", "种子节点异常，请检查");
        console.log(error)
        //exit();
        return;
      }  
      var nodeArr = []
      for(var key in nodes) {
        nodeArr.push(nodes[key])
      }
      lib.syncLoop(nodeArr.length, function (loop) {
        var i = loop.iteration();
        var peerItem = nodeArr[i]
        peerItem.address = peerItem.address.split(':')[0]
        console.log('节点：',peerItem.address)
        db.find_peer(peerItem.address, function(peer) {
          if (peer) {
            // peer already exists
            db.update_peer(peerItem.address, peerItem,function(){
              loop.next();
            })
          } else {
            
            // ASN:{"autonomousSystemNumber":135629,"autonomousSystemOrganization":"Ningxia West Cloud Data Technology Co.Ltd.","ipAddress":"161.189.161.213","network":"161.189.0.0/16"}
            // City: 
            // {
            //   country: {
            //   geonameId: 1814991,
            //   isoCode: "CN",
            //   names: {
            //   de: "China",
            //   en: "China",
            //   es: "China",
            //   fr: "Chine",
            //   ja: "中国",
            //   pt-BR: "China",
            //   ru: "Китай",
            //   zh-CN: "中国"
            //   }
            //   },
            //   maxmind: { },
            //   registeredCountry: {
            //   geonameId: 1814991,
            //   isoCode: "CN",
            //   names: {
            //   de: "China",
            //   en: "China",
            //   es: "China",
            //   fr: "Chine",
            //   ja: "中国",
            //   pt-BR: "China",
            //   ru: "Китай",
            //   zh-CN: "中国"
            //   },
            //   isInEuropeanUnion: false
            //   },
            //   representedCountry: { },
            //   traits: {
            //   isAnonymous: false,
            //   isAnonymousProxy: false,
            //   isAnonymousVpn: false,
            //   isHostingProvider: false,
            //   isLegitimateProxy: false,
            //   isPublicProxy: false,
            //   isSatelliteProvider: false,
            //   isTorExitNode: false,
            //   ipAddress: "161.189.161.213",
            //   network: "161.189.0.0/16"
            //   },
            //   city: { },
            //   location: {
            //   accuracyRadius: 50,
            //   latitude: 34.7725,
            //   longitude: 113.7266,
            //   timeZone: "Asia/Shanghai"
            //   },
            //   postal: { },
            //   subdivisions: [ ]
            //   }

            //获取城市
            Reader.open('./scripts/geoip/GeoLite2-City.mmdb').then(r => {
              const response = r.city(peerItem.address)
              peerItem.latitude = response.location.latitude
              peerItem.longitude = response.location.longitude
              peerItem.timeZone = response.location.timeZone

              if(peerItem.latitude && peerItem.longitude) {
                //根据经纬度计算城市
                var url = 'http://api.map.baidu.com/reverse_geocoding/v3/?ak=VRvx5Q5vwGvSRA6NQBcMa4ll2K3p77cU&output=json&coordtype=wgs84ll&location=' + peerItem.latitude + ',' + peerItem.longitude
                request({uri: url, json: true},(err,response) => {
                  if(err) {
                    console.log(err)
                    loop.next();
                  } else if (response.statusCode == 200 && response.body.status == 0) {
                    var result = response.body.result
                    peerItem.country = result.addressComponent.country
                    peerItem.province = result.addressComponent.province
                    peerItem.city = result.addressComponent.city

                    //获取运营商
                    Reader.open('./scripts/geoip/GeoLite2-ASN.mmdb').then(asnr => {
                      const asnres = asnr.asn(peerItem.address)
                      if(asnres.autonomousSystemOrganization) {
                        peerItem.asn = asnres.autonomousSystemOrganization
                      }else {
                        peerItem.asn = '未知运营商'
                      }
                      db.create_peer(peerItem,function(err){
                        if(err) {
                          console.log('节点保存失败：', err)
                        }else {
                          console.log('完成节点加入：', peerItem.address)
                        }
                        loop.next()
                      })
                    })
                  } else {
                    console.log(response.body.status)
                    loop.next()
                  }
                })
              }else {
                loop.next();
              }
            })
          }
        });
      }, function() {
        exit();
      });
    });
  }
});

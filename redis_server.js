/**
 * Created by tou on 16/11/17.
 */

var reids=require('redis');
var client=reids.createClient();

client.on('ready',function (err) {
    console.log('ready');
});

client.on('error',function (err) {
    console.log(err);
});

//密码验证
// client.auth();
client.on('connect',function () {
    client.select('7', function(error){
        if(error) {
            console.log(error);
        } else {
            // lrange
            client.lrange('userlist', '0', '-1', function(error, res){
                if(error) {
                    console.log(error);
                } else {
                    console.log(res);
                }

                // 关闭链接
                client.quit();
            });
        }
    });
});
/**
 * Created by tou on 16/11/15.
 */

/*
* Restful 接口定义
*   URI       HTTP方法   发送数据   结果
* GetNameList  Get         空      获取用户列表
* InsertName   Post       name     新增用户
* DeleteName   Post       id       删除用户
* UpdateName   Post       id       编辑用户
*
* */
var express=require('express');
var mysql=require('mysql');
var bodyParser = require('body-parser');
var multer  = require('multer');
var app=express();

var common=require('./common');

//mysql连接池配置
var pool=mysql.createPool({
    host:'localhost',
    user:'root',
    password:'qazWSX123',
    database:'nodetest',
    port:8889
});

var resdata={
    status:1,
    data:[]
};

//redis部分
var reids=require('redis');
var client=reids.createClient();

// client.on('ready',function (err) {
//     console.log('ready');
// });

client.on('error',function (err) {
    console.log(err);
});

//密码验证
// client.auth();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(multer({ dest: '/uploads/'}).array('image'));

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
});

//请求用户名列表接口
app.get("/GetNameList",function (req,res) {
    var selectSQL="select *,date_format(create_date,'%Y-%m-%d %H:%i:%S') as create_date from t_user limit 10;";
    pool.getConnection(function (err,conn) {
        if (err){
            console.log(err);
        }
        else {
            conn.query(selectSQL,function (err,rows) {
                if(err) console.log(err);
                // console.log("SELECT ==> ");
                // for(var i in rows){
                //     console.log(rows[i]);
                // }
                else {
                    resdata['msg']='查询成功!';
                    resdata['data']=rows;
                    res.json(resdata);
                }
                conn.release();
            });
        }
    });
});

//redis获取用户名列表
app.get("/GetNameList_r",function (req,res) {
    // client.on('connect',function () {
        client.select('7',function (err) {
            if(err){
                console.log(err);
            }
            else {
                client.lrange('userlist','0','-1',function (err,rows) {
                    if(err){
                        console.log(err);
                    }
                    else {
                        var rdata={};
                        rdata['msg']='查询成功!';
                        var bb=common.ParseJsonRadis(rows);
                        console.log(bb);
                        rdata['data']=bb;
                        res.json(rdata);
                    }
                    // client.quit();
                });
            }
        });
    // });
});

//新增用户
app.post("/InsertName",function (req,res) {
    // console.log(req.body);
    var pname=req.body.name;
    if(!pname){
        resdata.status=0;
        resdata.msg="请求参数错误!";
        res.end(resdata);
    }
    else {
        var insert_sql= 'insert into t_user(name) values("'+ pname +'")';
        pool.getConnection(function (err,conn) {
            if (err){
                resdata.status=0;
                resdata.msg=err;
                res.end(resdata);
                console.log(err);
            }
            else {
                conn.query(insert_sql,function (err,rows) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        var rdata={};
                        rdata.status=1;
                        rdata['msg']='新增用户成功!';
                        res.json(rdata);
                    }
                    conn.release();
                });
            }
        });

        //存入redis
        client.select('7',function (err,res) {
            if (err){
                console.log(err);
            }
            else {
                var time=new Date().format('yyyy-MM-dd hh:mm:ss');
                var info={
                    name:pname,
                    create_date:time
                };
                var jinfo=JSON.stringify(info);
                client.rpush('userlist',jinfo);
            }
            // client.quit();
        });
    }
});

var server=app.listen(9876,function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
});


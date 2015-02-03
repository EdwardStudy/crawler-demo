/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var path = require('path');
var url = require('url');
var ejs = require('ejs');
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');

var tUrl = 'https://cnodejs.org/';
superagent.get(tUrl)
    .end(function (err, res) {
        if (err) {
            return console.error(err);
        }
        var topicUrls = [];
        var $ = cheerio.load(res.text);
        // 获取首页所有的链接
        $('#topic_list .topic_title').each(function (idx, element) {
            var $element = $(element);
            var href = url.resolve(tUrl, $element.attr('href'));
            topicUrls.push(href);
        });

        //输出url
        //console.log(topicUrls);

        var ep = new eventproxy();

        //The callback will be executed after the event be fired N times.
        //params: eventname(String),times(Number),callback
        ep.after('topic_html', topicUrls.length, function(topics){
            // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair
            //pair =  [topicUrl, res.text], res.text = 整个html
            topics = topics.map(function(topicPair){
                //use cheerio

                var topicUrl = topicPair[0];
                var topicHtml = topicPair[1];
                var $ = cheerio.load(topicHtml);
                var userHref = 'https://cnodejs.org' + $('.reply_author').eq(0).attr('href');
                userHref = url.resolve(tUrl, userHref);
                //console.log(userHref);
                //console.log($('.reply_author').eq(0).text());

                //var userHref = url.resolve(tUrl, $('.reply_author').get(0).attribs.href);
                //console.log(userHref);
                //console.log($('.reply_author').get(0).children[0].data);
                var title = $('.topic_full_title').text().trim().replace(/\n/g,"");;
                var href = topicUrl;
                var comment1 = $('.reply_content').eq(0).text().trim();
                var author1 = $('.reply_author').eq(0).text().trim();

                ep.emit('user_html', [userHref, title, href, comment1, author1]);

                return ({
                    title: $('.topic_full_title').text().trim(),
                    href: topicUrl,
                    comment1: $('.reply_content').eq(0).text().trim(),
                    userHref: userHref
                });
            });

            //outcome
            //console.log('outcome:');
            //console.log(topics);
        });

        //find userDetails
        ep.after('user_html', topicUrls.length, function(users){
            users = users.map(function(user){
                var userUrl = user[0];
                var score = 0;

                superagent.get(userUrl)
                    .end(function (err, res) {
                        if (err) {
                            return console.error(err);
                        }
                        //console.log(res.text);
                        var $ = cheerio.load(res.text);
                        score = $('.big').slice(0).eq(0).text().trim();
                        ep.emit('got_score', [user[1], user[2], user[3], user[4], score]);
                        //ep.emit('scored', score);
                        //console.log(user[1]);
                        //console.log(user[2]);
                        //console.log(user[3]);
                        //console.log(user[4]);
                        //console.log($('.big').text().trim());
                    });


                //return ({
                //    title: user[1],
                //    href: user[2],
                //    comment1: user[3],
                //    author1: user[4],
                //    score1: score
                //});
            });

            //outcome
            console.log('outcome:');
            //console.log(users);
            ep.after('got_score', 10, function(users){
                console.log(users);
            });
        });

        topicUrls.forEach(function (topicUrl) {
            superagent.get(topicUrl)
                .end(function (err, res) {
                    //console.log('fetch ' + topicUrl + ' successful');
                    ep.emit('topic_html', [topicUrl, res.text]);
                });
        });
    });

//var app = express();
//
//app.set('port', process.env.PORT || 3000);
////app.set('views', path.join(__dirname, 'views'));
////app.engine('.html', ejs.__express);
//
//app.get('/',function (req, res, next) {
//    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
//    superagent.get('https://cnodejs.org/')
//        .end(function (err, sres) {
//            // 常规的错误处理
//            if (err) {
//                return next(err);
//            }
//            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
//            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
//            // 剩下就都是 jquery 的内容了
//            var $ = cheerio.load(sres.text);
//            var items = [];
//            $('#topic_list .topic_title').each(function (idx, element) {
//                var $element = $(element);
//                items.push({
//                    title: $element.attr('title'),
//                    href: $element.attr('href')
//                });
//            });
//
//            res.send(items);
//        });
//});
//
//app.listen(3000, function(){
//    console.log('Express server listening on port ' + 3000);
//});

var cheerio = require('cheerio');
var superagent = require('superagent');

/* GET home page. */
exports.index = function (req, res) {
    res.render('index', {title: 'Crawler Demo'});
};

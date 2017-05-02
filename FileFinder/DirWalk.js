'use strict';
//引入child_process模块
var fs = require("fs");
var path = require("path");

var walker = {
    walk: function (dirpath,handleFunc) {
        fs.readdir(dirpath, (err, files) => {
            if (err) {
                console.log(err);
                return;
            }
            var i = 0;
            files.forEach((filename) => {
                fs.stat(path.join(dirpath, filename), (err, stats) => {
                    console.log(path.join(dirpath,filename)+" "+(++i))
                    if (err)
                        throw err;
                    if (stats.isFile()) {
                        handleFunc(path.join(dirpath, filename));
                    }
                    if (stats.isDirectory()) {
                        walker.walk(path.join(dirpath, filename), handleFunc);
                    }
                });
            });
            
        });
    }
}
module.exports = walker;
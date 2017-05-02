'use strict';
var fs = require('fs');
var path = require("path");
var crypto = require('crypto');
var natural = require("natural");
var Set = require("set");
var english = new Set(fs.readFileSync("./resource/english", { encoding: "utf-8" }).split("\n"));
var wordTokenizer = new natural.WordTokenizer();
var {ipcMain} = require("electron");
var wordTokenize = {
    fdSet: new Set(),
    textFileTokenize: function (dbName,filepath) {
        var con = require("./sqlite3.js");
        var tmp = "";
        var result = new Set();
        var stream = fs.createReadStream(filepath);
        var md5sum = crypto.createHash('md5');
        var fd;
        stream.on("open", () => {
            fd=stream.fd
            wordTokenize.fdSet.add(fd);
            ipcMain.emit("fsopen");
        }
        );
        stream.on("data", (chunk) => {
            var string = chunk.toString();
            string += tmp;
            var lastIndex = string.lastIndexOf("\n");
            if (lastIndex != string.length - 1) {
                tmp = string.substr(lastIndex);
                string = string.substr(0, lastIndex);
            }
            result = result.union(new Set(wordTokenizer.tokenize(string)));
            md5sum.update(chunk);
        });
        stream.on("close", () => {
            wordTokenize.fdSet.remove(fd);
            ipcMain.emit("fsclose");
            result = result.difference(english).difference(english);
            //con.insertOrUpdateFile(new Buffer(path.parse(filepath).dir).toString("base64"),md5sum.digest("hex"),filepath, result);
            con.insertOrUpdateFile(dbName, md5sum.digest("hex"), filepath, result);
        });
    }
}
module.exports = wordTokenize;
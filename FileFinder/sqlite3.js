'use strict';
var sqlite3 = require("sqlite3").verbose();
var {ipcMain} = require("electron");

var fs = require("fs");
var path = require("path");
var walker = require("./DirWalk.js");

var dbpath = "./database/";
fs.exists(dbpath, (exists) => {
    if (!exists)
        fs.mkdir(dbpath);
});

var con = {
    createDB: function (dbName) {
        var db = new sqlite3.Database(dbpath + dbName + ".db");
        db.serialize(function () {
            db.run("CREATE TABLE IF NOT EXISTS `file_index` (`md5` char(32) NOT NULL,`filepath` text NOT NULL,PRIMARY KEY (`filepath`))");
            db.run("CREATE VIRTUAL TABLE IF NOT EXISTS `WordOfBag` USING fts3(`md5` char(32) NOT NULL,`wordbag` text NOT NULL)");
        });
        db.close();
    },
    InitDBOrUpdateDB: function (dbName) {
        var wordTokenize = require("./naturalTest.js");
        var db = new sqlite3.Database(dbpath + dbName + ".db");
        db.serialize(function () {
            db.run("CREATE TABLE IF NOT EXISTS `file_index` (`md5` char(32) NOT NULL,`filepath` text NOT NULL,PRIMARY KEY (`filepath`))");
            db.run("CREATE VIRTUAL TABLE IF NOT EXISTS `WordOfBag` USING fts3(`md5` char(32) NOT NULL,`wordbag` text NOT NULL)");
        });
        db.close();
        walker.walk(new Buffer(dbName, "base64").toString(), (filename) => {
            wordTokenize.textFileTokenize(dbName, filename);
        });
    },
    insertOrUpdateFile: function (dbName, md5value, filepath, setObj) {
        var db = new sqlite3.Database(dbpath + dbName + ".db");
        db.configure("busyTimeout", 60000);
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS `file_index` (`md5` char(32) NOT NULL,`filepath` text NOT NULL,PRIMARY KEY (`filepath`))");
            db.run("CREATE VIRTUAL TABLE IF NOT EXISTS `WordOfBag` USING fts3(`md5` char(32) NOT NULL,`wordbag` text NOT NULL)");
            var search = db.prepare("select fi.rowid as id,fi.filepath,wb.wordbag,wb.md5 FROM `file_index` as fi LEFT JOIN `WordOfBag` as wb ON wb.md5 = fi.md5 where filepath=?");
            search.get([filepath], (err, row) => {
                if (row == undefined) {
                    console.log("UPDATE " + filepath);
                    db.run("INSERT INTO `WordOfBag` VALUES(?,?)", [md5value, setObj.get().toString()]);
                    db.run("INSERT INTO `file_index` VALUES(?,?)", [md5value, filepath]);
                    db.close();
                } else {
                    if (row.md5 != md5value) {
                        console.log("UPDATE " + filepath);
                        db.run("UPDATE `file_index` SET md5 = ? where md5=?", md5value, row.md5);
                        db.run("UPDATE `WordOfBag` SET md5 = ? ,wordbag=? where md5=?", md5value, setObj.get().toString(), row.md5);
                        db.close();
                    }
                }
                //console.log(md5value);
                //console.log(row);
            }
            );
            search.finalize();

        });    
        
    },
    getAllFile: function (dbName) {
        var db = new sqlite3.Database(dbpath + dbName + ".db");
        db.each("SELECT fi.rowid AS id,fi.filepath,wb.wordbag,wb.md5 FROM `file_index` AS fi LEFT JOIN `WordOfBag` AS wb ON wb.md5 = fi.md5", (err, row) => {
        }
        );
        db.close();
    },
    findWord: function (dbName,array) {
        var db = new sqlite3.Database(dbpath + dbName + ".db");
        if (array.length == 0) {
            console.log("Can not search without KeyWord");
            return;
        }
        array.sort((a, b) => { return a.length > b.length });
        var tmp = "";
        for (var i = array.length-1; i >=0; i--) {
            if (i == array.length-1) {
                tmp = " SELECT md5 FROM `WordOfBag` WHERE wordbag MATCH 'wordbag:"+array[i];
            } else {
                tmp += " wordbag:"+array[i];
            }
        }
        tmp += "'";
        var search = db.prepare("SELECT fi.rowid AS id,wb.md5,filepath,wordbag FROM `WordOfBag` AS wb LEFT JOIN `file_index` AS fi ON wb.md5 = fi.md5 where wb.md5 IN ("+tmp+")");
        search.each((err, row) => {
            ipcMain.emit("sendAddToWin", row);
        }, (err, totalCount) => {
            console.log(err);
            console.log("Total: " + totalCount);

        })
        search.finalize();
        db.close();
    }
}
module.exports = con;
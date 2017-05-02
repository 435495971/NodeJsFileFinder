var con = require("./sqlite3.js");
var path = require("path");
var fs = require("fs");
var wordTokenize = require("./naturalTest.js");
if (process.argv.length <= 2) {
    console.log("run narmal");
    fs.readdir("./database/", (err, files) => {
        if (err) {
            console.log(err);
            return;
        }
        files.forEach((file) => {
            if (file.endsWith(".db")) {
                console.log("--Update db:" + file);
                con.InitDBOrUpdateDB(file.substring(0, file.length - 3));
            }
        });
    });
} else {
    for (var i = 2; i < process.argv.length; i++) {
        var file = process.argv[i];
        console.log("--Build db:", file);
        con.InitDBOrUpdateDB(file);
    }
}

var {ipcMain} = require("electron");
var quitTimer;
ipcMain.on("fsopen", () => {
    console.log("new fd open,now size is:" + wordTokenize.fdSet.size());
    clearTimeout(quitTimer);
});
ipcMain.on("fsclose", () => {
    console.log("a fd close,now size is:" + wordTokenize.fdSet.size());
    if (wordTokenize.fdSet.size() == 0) {
        console.log("GOing to quit Init Thread");
        quitTimer=setTimeout(require("electron").app.quit, 60 * 1000);
    }
        
});
'use strict';
//引入child_process模块
var child_process = require("child_process");
const electron = require('electron');
// 控制应用生命周期的模块
const {app} = electron;
// 创建本地浏览器窗口的模块
const {BrowserWindow} = electron;
// 创建ipc模块
const {ipcMain} = electron;
//创建dialog模块
const {dialog} = electron;
// 指向窗口对象的一个全局引用，如果没有这个引用，那么当该javascript对象被垃圾回收的
// 时候该窗口将会自动关闭
let wins = [];
let win;

//启动自定义的init线程
let initProcess;
if (process.platform == 'win32')
    initProcess = child_process.spawn(__dirname + "/node_modules/.bin/electron.cmd", [__dirname+"/Init.js"]);
else
    initProcess = child_process.spawn(__dirname + "/node_modules/.bin/electron", [__dirname+"/Init.js"]);

initProcess.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});

initProcess.stderr.on('data', function (data) {
    console.log('stderr: ' + new Buffer(data, "gb2312"));
});

initProcess.on('close', function (code) {
    console.log('child process exited with code ' + code);
});
function createWindow() {
    //更新数据库

    // 创建一个新的浏览器窗口
    win = new BrowserWindow({ width: 800, height: 600 });

    // 并且装载应用的index.html页面
    win.loadURL(`file://${__dirname}/resource/html/index.html`);

    // 打开开发工具页面
    win.webContents.openDevTools();

    // 当窗口关闭时调用的方法
    win.on('closed', () => {
        // 解除窗口对象的引用，通常而言如果应用支持多个窗口的话，你会在一个数组里
        // 存放窗口对象，在窗口关闭的时候应当删除相应的元素。
        win = null;
    });
}

// 当Electron完成初始化并且已经创建了浏览器窗口，则该方法将会被调用。
// 有些API只能在该事件发生后才能被使用。
app.on('ready', () => {
    createWindow();
});

// 当所有的窗口被关闭后退出应用
app.on('window-all-closed', () => {
    // 对于OS X系统，应用和相应的菜单栏会一直激活直到用户通过Cmd + Q显式退出
    if (process.platform !== 'darwin') {
        if (initProcess.exitCode == undefined) {
            var thread_kill = require("./thread_kill.js");

            console.log("InitProcess is not finish  :" + initProcess.pid);
            console.log("killing InitProcess");
            thread_kill(initProcess.pid, "SIGKILL",app.quit);
        } else {
            app.quit();
        }
        
    }
});

app.on('activate', () => {
    // 对于OS X系统，当dock图标被点击后会重新创建一个app窗口，并且不会有其他
    // 窗口打开
    if (win === null) {
        createWindow();
    }
});

ipcMain.on("sendAddToWin", (args) => {
    win.webContents.send("add", args);
});
ipcMain.on("open-file-dialog", (event) => {
    dialog.showOpenDialog({
        properties: ["multiSelections", "openDirectory"]
    }, (files) => {
        console.log(files);
        if (files)
            event.sender.send("selected-directory", files);
        })
})


// 在这个文件后面你可以直接包含你应用特定的由主进程运行的代码。
// 也可以把这些代码放在另一个文件中然后在这里导入。
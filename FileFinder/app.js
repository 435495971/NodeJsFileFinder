'use strict';
//����child_processģ��
var child_process = require("child_process");
const electron = require('electron');
// ����Ӧ���������ڵ�ģ��
const {app} = electron;
// ����������������ڵ�ģ��
const {BrowserWindow} = electron;
// ����ipcģ��
const {ipcMain} = electron;
//����dialogģ��
const {dialog} = electron;
// ָ�򴰿ڶ����һ��ȫ�����ã����û��������ã���ô����javascript�����������յ�
// ʱ��ô��ڽ����Զ��ر�
let wins = [];
let win;

//�����Զ����init�߳�
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
    //�������ݿ�

    // ����һ���µ����������
    win = new BrowserWindow({ width: 800, height: 600 });

    // ����װ��Ӧ�õ�index.htmlҳ��
    win.loadURL(`file://${__dirname}/resource/html/index.html`);

    // �򿪿�������ҳ��
    win.webContents.openDevTools();

    // �����ڹر�ʱ���õķ���
    win.on('closed', () => {
        // ������ڶ�������ã�ͨ���������Ӧ��֧�ֶ�����ڵĻ��������һ��������
        // ��Ŵ��ڶ����ڴ��ڹرյ�ʱ��Ӧ��ɾ����Ӧ��Ԫ�ء�
        win = null;
    });
}

// ��Electron��ɳ�ʼ�������Ѿ���������������ڣ���÷������ᱻ���á�
// ��ЩAPIֻ���ڸ��¼���������ܱ�ʹ�á�
app.on('ready', () => {
    createWindow();
});

// �����еĴ��ڱ��رպ��˳�Ӧ��
app.on('window-all-closed', () => {
    // ����OS Xϵͳ��Ӧ�ú���Ӧ�Ĳ˵�����һֱ����ֱ���û�ͨ��Cmd + Q��ʽ�˳�
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
    // ����OS Xϵͳ����dockͼ�걻���������´���һ��app���ڣ����Ҳ���������
    // ���ڴ�
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


// ������ļ����������ֱ�Ӱ�����Ӧ���ض��������������еĴ��롣
// Ҳ���԰���Щ���������һ���ļ���Ȼ�������ﵼ�롣
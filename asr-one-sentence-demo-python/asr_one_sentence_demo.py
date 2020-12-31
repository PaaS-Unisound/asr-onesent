# coding:utf-8
import websocket
import hashlib
import json
import time
import ssl
import base64
from functools import partial
try:
    import thread
except ImportError:
    import _thread as thread
from log_util import log_format
import logging
import os
import re

logger = logging.getLogger("output")

class Ws_parms(object):
    '''
    参数类，websocket测试需要的参数相关
    '''
    
    def __init__(self, url, appkey, secret, pid, audiotype, audioFile=r"123.pcm", user_id="", domain="general"):
        self.url = url
        self.appkey = appkey
        self.secret = secret
        self.user_id = user_id
        self.domain = domain
        self.audioFile = audioFile
        self.audiotype = audiotype
        self.variables = []
        self.fixeds = []
        self.delpunc = ''
        self.punc = ''
        self.status = False
        self.message = ''
        self.code = 0
        self._pid = pid
        self.logger = logging.getLogger("RunLog")

        # 指定logger输出格式
        formatter = logging.Formatter('%(asctime)s %(levelname)-8s: %(message)s')

        # 文件日志
        file_handler = logging.FileHandler("logs/log_%s" % self._pid)
        file_handler.setFormatter(formatter)  # 可以通过setFormatter指定输出格式

        # 为logger添加的日志处理器
        self.logger.addHandler(file_handler)
        #self.logger.addHandler(console_handler)

        # 指定日志的最低输出级别，默认为WARN级别
        self.logger.setLevel(logging.INFO)
        pass


    def get_sha256(self, timestamp):
        hs = hashlib.sha256()
        hs.update((self.appkey + timestamp + self.secret).encode('utf-8'))
        signature = hs.hexdigest().upper()
        return signature

    def get_url(self):
        timestamp = str(int(time.time() * 1000))
        self.url = self.url + '?'+'time=' + timestamp + '&appkey=' + \
                   self.appkey + '&sign=' + self.get_sha256(timestamp)
        return self.url

def on_message(ws, message, wsParms):
    print('on message:'+message)
    log = "on_message: {}".format(message)
    wsParms.logger.info(log_format(log))
    try:
        if "code" in message:
            wsParms.code = json.loads(message).get('code')
            if wsParms.code==0:
                wsParms.message = message
        if "type" in message:
            type_value = json.loads(message).get('type')
            if type_value == "variable":
                wsParms.variables.append(json.loads(message))
            elif type_value == "fixed" or type_value == "lastFixed":
                wsParms.fixeds.append(json.loads(message))
    except Exception as e:
        log = "receive msg,but parse exception: {}".format(e)
        wsParms.logger.info(log_format(log))
        print("receive msg,but parse exception:", e)

def on_error(ws, error):
    print("error: ", error)

def on_close(ws):
    print("### closed ###")

def on_open(ws, wsParms):
    def run(*args):
        frameSize = 9600  # 每一帧的音频大小 300ms。32000 * 300 / 1000
        intervel = 0.3  # 发送音频间隔(单位:s)
        status = "start"  # 音频的状态信息，标识音频是第一帧，还是中间帧、最后一帧
        with open(wsParms.audioFile, "rb") as fp:
            while True:
                buf = fp.read(frameSize)
                # 文件结束
                if not buf:
                    status = "end"
                # 参数帧处理
                if status == "start":
                    d = {
                        "type": "start",
                        "data":{
                            "user_id": wsParms.user_id,
                            "domain": wsParms.domain,
                            "lang": "cn",
                        }
                    }
                    print(d)
                    ws.send(json.dumps(d))
                    ws.send(buf, 2)
                    status = "continue"
                # 数据帧处理
                elif status == "continue":
                    ws.send(buf, 2)
                    time.sleep(intervel)
                # 结束帧处理
                elif status == "end":
                    d = {"type": "end"}
                    ws.send(json.dumps(d))
                    time.sleep(1)
                    break

    thread.start_new_thread(run, ())
def ensure_dir(dir_path):
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def rm_logs(dir_path):
    log_file = os.listdir(dir_path)
    for logf in log_file:
        if os.path.exists(dir_path+logf) and logf != "log.output":
            os.remove(dir_path+logf)

def get_audioname(dir_path, audiotype):
    log_files = os.listdir(dir_path)
    r = re.compile('.+\.(?=wav$|pcm$|speex$|spx$|adpcm$|mp3$|opus-std$)')
    audionames = [dir_path + logs for logs in log_files if re.search(r, logs)]
    return audionames


def do_ws(wsP):
    ws_url = wsP.get_url()
    websocket.enableTrace(False)
    print(ws_url)
    ws = websocket.WebSocketApp(url=ws_url,
    on_error = on_error,
    on_close = on_close)
    ws.on_open = partial(on_open, wsParms=wsP)
    ws.on_message = partial(on_message, wsParms=wsP)
    ws.run_forever()
    variables_log = "variables lens: {}, values: {}".format(len(wsP.variables), wsP.variables)
    wsP.logger.info(log_format(variables_log))
    fixeds_log = "fixeds lens: {}, values: {}".format(len(wsP.fixeds), wsP.fixeds)
    wsP.logger.info(log_format(fixeds_log))
    if wsP.code == 0:
        texts = [text.get('text') for text in wsP.fixeds]
        wsP.punc = "".join(texts)
    return wsP
    

def write_results(wsParms):
    ensure_dir('results')
    t1 = str(int(time.time()))
    punc_report = os.path.join('results/', 'punc_' + t1)
    new_wsParms = sorted(wsParms, key=lambda x:re.split('-', re.split(r'/', x.audioFile)[-1])[0])
    with open(punc_report, 'a+') as f:
        for ws in new_wsParms:
            f.write(re.split(r'/', ws.audioFile)[-1] + ' ' + ws.punc + '\n')
    refFile = os.path.dirname(wsParms[0].audioFile) + '/ref'

    

appkey='************************'
secret='************************'
ws_url='wss://ws-osasr.hivoice.cn/v1/asr'

if __name__ == "__main__":
    ensure_dir('logs')
    rm_logs('logs/')
    url = ws_url

    pid=1
    user_id = 'asr-one-sentence-demo-python'
    domain = 'general'
    
    audioFile = 'audio/'
    audiotype = 'wav'
    audionames = get_audioname(audioFile, audiotype)
    ws_results = []
    cnt=0
    for audioFile in audionames:
        wsP = Ws_parms(
            url=url,
            appkey=appkey,
            secret=secret,
            pid=pid,
            audioFile=audioFile,
            audiotype=audiotype,
            user_id=user_id,
            domain=domain
        )
        ws_results.append(do_ws(wsP))
        print('test done:'+str(cnt))
    time.sleep(5)
    write_results(ws_results)   

import React, { useState, useEffect } from 'react';
import cstyle from '../common.less';
import style from './test.less';
import Recorder from '@/utils/Recorder';
import { Config, AiCode } from '@/config';
import { message } from 'antd';

import { sha256 } from 'js-sha256';

const langArr = ['cn', 'sichuanese', 'cantonese', 'en'];
let interalHandler: any;
let recorder: any;
let ws: any;

export default () => {
  const [current, setCurrent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [result, setResult] = useState<Array<any>>([]);
  const { appKey, secret, path } = Config[AiCode.One];

  let ctime = time;
  function startRecording() {
    setRecording(true);

    interalHandler = setInterval(() => {
      ctime = ctime + 1;
      if (ctime > 60) {
        endRecording();
      }
      setTime(ctime);
    }, 1000);
    doRecording();
  }
  function endRecording() {
    clearInterval(interalHandler);
    setRecording(false);
    setTime(0);
    ctime = 0;
    stopRecording();
  }

  function doRecording() {
    recorder = new Recorder(onaudioprocess);
    createWS();
    recorder.ready().then(
      () => {
        recorder.start();
      },
      () => {
        message.warn('录音启动失败！');
        if (ws) ws.close();
      },
    );
  }

  function createWS() {
    const tm: number = +new Date();
    const sign = sha256(`${appKey}${tm}${secret}`).toUpperCase();

    ws = new WebSocket(`${path}?appkey=${appKey}&time=${tm}&sign=${sign}`);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'start',
          sha: '256',
          data: {
            lang: langArr[current],
            appkey: appKey,
            userId: 'demoUser',
            udid: 'demoWebDevice',
          },
        }),
      );

      // ws.close();
    };
    let msgArr: Array<any> = [];
    ws.onmessage = (evt: any) => {
      const res = JSON.parse(evt.data);
      if (res.code == 0 && res.text) {
        if (msgArr.length > 0 && msgArr[msgArr.length - 1].type !== 'fixed') {
          msgArr[msgArr.length - 1] = res;
        } else {
          msgArr.push(res);
        }
        setResult([...msgArr]);
      }
    };

    ws.onclose = (e: any) => {
      ws.close();
      msgArr = [];
      ws = null;
    };
  }

  function onaudioprocess(buffer: any) {
    if (ws && ws.readyState === 1) {
      ws.send(buffer);
    }
  }
  function stopRecording() {
    if (!recorder) return;
    recorder.stop();
    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: 'end',
        }),
      );
    }
  }
  const timer = `0:${time > 9 ? time : '0' + time}`;
  return (
    <div
      style={{
        backgroundColor: '#f7f9fb',
      }}
      className={cstyle.bigBlock}
      id="test"
    >
      <div className={cstyle.title}>一句话识别</div>
      <div className={style.boxContainer}>
        <div className={style.box}>
          <div className={cstyle.subTitle}>语音录入（≤60秒）</div>
          <div className={style.borderBox}>
            <ul className={style.tabs}>
              <li
                className={`${style.tab} ${current === 0 ? style.active : ''}`}
                onClick={() => !recording && setCurrent(0)}
              >
                普通话
              </li>
              <li
                className={`${style.tab} ${current === 1 ? style.active : ''}`}
                onClick={() => !recording && setCurrent(1)}
              >
                四川话
              </li>
              <li
                className={`${style.tab} ${current === 2 ? style.active : ''}`}
                onClick={() => !recording && setCurrent(2)}
              >
                粤语
              </li>
              <li
                className={`${style.tab} ${current === 3 ? style.active : ''}`}
                onClick={() => !recording && setCurrent(3)}
              >
                英语
              </li>
            </ul>
            <div className={style.micbox}>
              <div
                onClick={() => {
                  if (!recording) {
                    setResult([]);
                    startRecording();
                  } else {
                    endRecording();
                  }
                }}
                className={recording ? style.imgRecording : style.img}
              >
                {recording && (
                  <div className={style.imgtext}>
                    <img src={require('@/assets/icon_pause.png')} height="33" />
                    <div>
                      <span style={{ color: '#FFB700' }}>{timer}</span>
                      <span>/1:00</span>
                    </div>
                  </div>
                )}
              </div>
              {!recording && (
                <div className={style.desc}>
                  点击“麦克风”开始录音，请对我说想说的话，我可以识别出你说的内容。请允许浏览器获取麦克风权限。
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={style.box}>
          <div className={cstyle.subTitle}>识别结果</div>
          <div className={style.borderBox + ' ' + style.result}>
            {result.map(r => r.text).join('')}
          </div>
        </div>
      </div>
    </div>
  );
};

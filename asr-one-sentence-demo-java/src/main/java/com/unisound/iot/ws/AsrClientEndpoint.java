package com.unisound.iot.ws;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import javax.websocket.*;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;

@ClientEndpoint
public class AsrClientEndpoint {

    private String fileName;

    public AsrClientEndpoint(String fileName) {
        this.fileName = fileName;
    }

    @OnOpen
    public void onOpen(final Session session) {
        System.out.println("->创建连接成功");

        //发送start请求
        JSONObject frame = new JSONObject();
        frame.put("type", "start");
        JSONObject data = new JSONObject();
        frame.put("data", data);

        //领域
        data.put("domain", "general");
        //语言
        data.put("lang", "cn");
        //音频格式
        data.put("format", "pcm");
        //采样率
        data.put("sample", "16k");
        //是否可变结果
        data.put("variable", "true");
        //是否开启标点
        data.put("punctuation", "true");
        //是否开启数字转换
        data.put("post_proc", "true");
        //近讲 远讲
        data.put("acoustic_setting", "near");
        //智能断句
        data.put("server_vad", "false");
        //智能断句前静音
        data.put("max_start_silence", "1000");
        //智能断句尾静音
        data.put("max_end_silence", "500");

        try {
            //start
            session.getBasicRemote().sendText(frame.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
        new Thread(new Runnable() {
            public void run() {

                //发送数据
                try {
                    InputStream in = new FileInputStream(fileName);
                    byte[] audioData = new byte[9600];
                    int lenth = 0;
                    while ((lenth = in.read(audioData)) != -1) {
                        System.out.println("发送语音数据");
                        session.getAsyncRemote().sendBinary(ByteBuffer.wrap(audioData, 0, lenth));
                        //模拟采集音频休眠
                        Thread.sleep(300);
                    }
                    in.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }


                //发送End请求
                JSONObject frame2 = new JSONObject();
                frame2.put("type", "end");
                if (session.isOpen()) {
                    try {
                        session.getBasicRemote().sendText(frame2.toString());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }).start();
    }

    @OnMessage
    public void processMessage(Session session, String message) {
        System.out.println("服务端返回：" + message);
        JSONObject jsonObject = JSON.parseObject(message);
        boolean end = jsonObject.getBooleanValue("end");
        int code = jsonObject.getInteger("code");
        if (code != 0) {
            System.out.println("错误码：" + code);
            return;
        }
        String type = jsonObject.getString("type");
        String text = jsonObject.getString("text");
        if (end) {
            try {
                System.out.println(fileName + "识别结束");
                session.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @OnError
    public void processError(Throwable t) {
        t.printStackTrace();
    }
}

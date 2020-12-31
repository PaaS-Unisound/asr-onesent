package com.unisound.iot.ws;

import com.unisound.iot.util.SignCheck;

import javax.websocket.ContainerProvider;
import javax.websocket.DeploymentException;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * 一句话识别demo
 *
 * @author unisound
 * @date 2020/8/25
 */
public class AsrWebsocket {
    public static void main(String[] args) {
        //普通话
        String host = "wss://ws-osasr.hivoice.cn/v1/asr?";
        //方言、英语
        //String host = "wss://ws-osasr-dialect.hivoice.cn/v1/asr?";
        String appkey ="******************";
        String secret ="******************";
        long time = System.currentTimeMillis();
        StringBuilder paramBuilder = new StringBuilder();
        paramBuilder.append(appkey).append(time).append(secret);
        String sign = SignCheck.getSHA256Digest(paramBuilder.toString());

        StringBuilder param = new StringBuilder();
        param.append("appkey=").append(appkey).append("&")
                .append("time=").append(time).append("&")
                .append("sign=").append(sign);
        String str = host + param.toString();
        URI uri = null;
        try {
            uri = new URI(str);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }

        WebSocketContainer container = ContainerProvider.getWebSocketContainer();

        try {
            Session session = container.connectToServer(new AsrClientEndpoint("audio/unisound.wav"), uri);
        } catch (DeploymentException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }



        while(true){
            try {
                Thread.sleep(5 * 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

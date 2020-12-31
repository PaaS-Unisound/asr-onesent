package com.unisound.iot.util;

import org.apache.commons.lang3.StringUtils;

import java.security.MessageDigest;

public class SignCheck {
    private SignCheck() {

    }

    public static boolean check(String data, String sign) {
        if (StringUtils.isEmpty(sign)) {
            return false;
        }
        String sha1Digest = getSHA256Digest(data);
        return sign.equals(sha1Digest);

    }

    public static String getSHA256Digest(String data) {
        String digest = null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(data.getBytes("UTF-8"));
            digest = byte2hex(bytes);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return digest;
    }

    /**
     * 二进制转十六进制字符串
     *
     * @param bytes
     * @return
     */
    private static String byte2hex(byte[] bytes) {
        StringBuilder sign = new StringBuilder();
        for (int i = 0; i < bytes.length; i++) {
            String hex = Integer.toHexString(bytes[i] & 0xFF);
            if (hex.length() == 1) {
                sign.append("0");
            }
            sign.append(hex.toUpperCase());
        }

        return sign.toString();
    }
}

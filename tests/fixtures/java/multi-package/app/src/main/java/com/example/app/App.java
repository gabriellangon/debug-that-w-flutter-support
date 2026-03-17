package com.example.app;

import com.example.lib.Util;

public class App {
    public static void main(String[] args) {
        String greeting = Util.format("World");
        System.out.println(greeting);
        int result = Util.add(2, 3);
        System.out.println("result=" + result);
    }
}

package org.yagorundy;

import org.yagorundy.app.App;

class Main {
    public static void main(String[] args) {
        try {
            new App();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

package src.gui;

import java.awt.BorderLayout;

import src.gui.components.Footer;
import src.gui.components.Header;
import src.gui.components.Main;
import src.gui.reusable.Frame;

public class Gui {
    private Frame frame;

    private Header header;
    private Main main;
    private Footer footer;

    public Gui(String name) {
        this.frame = new Frame(name);
        
        this.header = new Header();
        this.frame.add(this.header, BorderLayout.NORTH);

        this.main = new Main();
        this.frame.add(this.main, BorderLayout.CENTER);

        this.footer = new Footer();
        this.frame.add(this.footer, BorderLayout.SOUTH);
    }

    public Frame getFrame() {
        return this.frame;
    }

    public Header getHeader() {
        return this.header;
    }

    public Main getMain() {
        return this.main;
    }

    public Footer getFooter() {
        return this.footer;
    }
}
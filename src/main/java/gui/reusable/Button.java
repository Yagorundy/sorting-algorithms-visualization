package main.java.gui.reusable;

import java.awt.Dimension;

import javax.swing.JButton;

public class Button extends JButton {
    /**
     *
     */
    private static final long serialVersionUID = -3456523689268254996L;

    public Button(String name) {
        super(name);
        Dimension size = new Dimension(150, 110);
        setMaximumSize(size);
        setPreferredSize(size);
    }
}
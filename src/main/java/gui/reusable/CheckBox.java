package main.java.gui.reusable;

import java.awt.Dimension;

import javax.swing.JCheckBox;

public class CheckBox extends JCheckBox {
    /**
     *
     */
    private static final long serialVersionUID = -327531561311140931L;

    public CheckBox(String text, boolean isChecked) {
        super(text, isChecked);
        Dimension size = new Dimension(150, 110);
        setMaximumSize(size);
        setPreferredSize(size);
    }
}
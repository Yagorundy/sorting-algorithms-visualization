package org.yagorundy.gui.reusable;

import javax.swing.JButton;

import org.yagorundy.gui.constants.GuiConstants;

public class Button extends JButton {
    /**
     *
     */
    private static final long serialVersionUID = -3456523689268254996L;

    public Button(String name) {
        super(name);
        setFont(GuiConstants.font);
        // setMaximumSize(GuiConstants.buttonSize);
        // setPreferredSize(GuiConstants.buttonSize);
    }
}

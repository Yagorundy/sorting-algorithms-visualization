package org.yagorundy.gui.reusable;

import javax.swing.JCheckBox;

import org.yagorundy.gui.constants.GuiConstants;

public class CheckBox extends JCheckBox {
    /**
     *
     */
    private static final long serialVersionUID = -327531561311140931L;

    public CheckBox(String text, boolean isChecked) {
        super(text, isChecked);
        setFont(GuiConstants.font);
        setMaximumSize(GuiConstants.checkBoxSize);
        setPreferredSize(GuiConstants.checkBoxSize);
    }
}

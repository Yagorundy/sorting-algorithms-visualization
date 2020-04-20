package org.yagorundy.gui.reusable;

import javax.swing.JRadioButton;

import org.yagorundy.gui.constants.GuiConstants;

public class RadioButton extends JRadioButton {
    /**
     *
     */
    private static final long serialVersionUID = -8262125351915171481L;

    public RadioButton(String text) {
        super(text);
        setFont(GuiConstants.font);
        setMaximumSize(GuiConstants.radioButtonSize);
        setPreferredSize(GuiConstants.radioButtonSize);
    }
}

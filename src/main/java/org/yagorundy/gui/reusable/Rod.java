package org.yagorundy.gui.reusable;

import java.awt.Color;
import java.awt.Dimension;

import javax.swing.JPanel;

import org.yagorundy.gui.constants.GuiConstants;

public class Rod<T> extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -4624637187298062798L;

    private T value;
    private int height;

    public Rod(T value, int height, Color color) {
        setAlignmentY(BOTTOM_ALIGNMENT);

        setHeight(height);
        setColor(color);
        setValue(value);
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }

    public int getHeight() {
        return this.height;
    }

    public void setHeight(int height) {
        this.height = height;
        setPreferredSize(new Dimension(GuiConstants.prefRodWidth, height));
        setMaximumSize(new Dimension(GuiConstants.maxRodWidth, height));

        revalidate();
        repaint();
    }

    public Color getColor() {
        return getBackground();
    }

    public void setColor(Color color) {
        setBackground(color);
    }
}

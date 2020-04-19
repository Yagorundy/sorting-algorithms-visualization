package org.yagorundy.gui.reusable;

import java.awt.Color;
import java.awt.Dimension;

import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;

public class Rod<T> extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -4624637187298062798L;

    private T value;
    private int height;

    private JPanel rod;
    private JLabel label;

    private static final int prefWidth = 75;
    private static final int maxWidth = 100;

    public Rod(T value, int height, Color color) {
        setAlignmentY(BOTTOM_ALIGNMENT);
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));

        setHeight(height);
        setColor(color);

        setValue(value);
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        if (label == null) {
            label = new JLabel("", JLabel.CENTER);
            add(label);
        }
        this.value = value;
        label.setText(value.toString());
    }

    public int getHeight() {
        return this.height;
    }

    public void setHeight(int height) {
        if (rod == null) {
            rod = new JPanel();
            add(rod);
        }
        this.height = height;
        setPreferredSize(new Dimension(prefWidth, height));
        setMaximumSize(new Dimension(maxWidth, height));
    }

    public void setColor(Color color) {
        rod.setBackground(color);
    }
}

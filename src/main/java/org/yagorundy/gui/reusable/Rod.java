package org.yagorundy.gui.reusable;

import java.awt.Color;
import java.awt.Dimension;

import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;

public class Rod extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -4624637187298062798L;

    private final int maxHeight = 1024;

    private int value;
    // TODO - refactor
    private int minValue;
    private int maxValue;

    private JPanel rod;
    private JLabel label;

    private static final int prefWidth = 75;
    private static final int maxWidth = 100;

    public Rod(int value, int minValue, int maxValue) {
        setAlignmentY(BOTTOM_ALIGNMENT);
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));

        init(value, minValue, maxValue);
    }

    private void init(int value, int minValue, int maxValue) {
        removeAll();

        this.value = value;
        this.minValue = minValue;
        this.maxValue = maxValue;

        int height = maxHeight / (maxValue - minValue + 1) * (value - minValue + 1);
        setPreferredSize(new Dimension(prefWidth, height));
        setMaximumSize(new Dimension(maxWidth, height));

        rod = new JPanel();
        rod.setBackground(Color.YELLOW);
        add(rod);

        label = new JLabel("" + value, JLabel.CENTER);
        add(label);

        revalidate();
        repaint();
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        init(value, minValue, maxValue);
    }
}

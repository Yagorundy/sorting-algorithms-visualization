package src.gui.reusable;

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

    private int value;
    private JPanel rod;
    private JLabel label;

    private static final int prefWidth = 75;
    private static final int maxWidth = 100;

    public Rod(int height, int value) {
        setAlignmentY(BOTTOM_ALIGNMENT);
        setPreferredSize(new Dimension(prefWidth, height));
        setMaximumSize(new Dimension(maxWidth, height));

        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        
        this.value = value;

        rod = new JPanel();
        rod.setBackground(Color.YELLOW);
        add(rod);

        label = new JLabel("" + value, JLabel.CENTER);
        add(label);
    }

    public int getValue() {
        return value;
    }
}
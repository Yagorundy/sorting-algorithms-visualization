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

    private JPanel rod;
    private JLabel label;

    private static final int prefWidth = 75;
    private static final int maxWidth = 100;

    public Rod(int height, String text) {
        setAlignmentY(BOTTOM_ALIGNMENT);
        setPreferredSize(new Dimension(prefWidth, height));
        setMaximumSize(new Dimension(maxWidth, height));

        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        
        rod = new JPanel();
        rod.setBackground(Color.YELLOW);
        add(rod);

        label = new JLabel(text, JLabel.CENTER);
        add(label);
    }

    public String getText() {
        return label.getText();
    }

    public void setText(String text) {
        label.setText(text);
    }
}
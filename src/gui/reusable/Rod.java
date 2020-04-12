package src.gui.reusable;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;

import javax.swing.JLabel;
import javax.swing.JPanel;

public class Rod extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -4624637187298062798L;

    private JPanel rod;
    private JLabel label;

    public Rod(int height, String text) {
        setLayout(new BorderLayout());
        
        rod = new JPanel();
        rod.setBackground(Color.YELLOW);
        rod.setPreferredSize(new Dimension(40, height));
        add(rod, BorderLayout.CENTER);

        label = new JLabel(text, JLabel.CENTER);
        add(label, BorderLayout.PAGE_END);
    }

    public String getText() {
        return label.getText();
    }

    public void setText(String text) {
        label.setText(text);
    }
}
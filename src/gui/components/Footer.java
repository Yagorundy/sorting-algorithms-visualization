package src.gui.components;

import java.awt.Color;

import javax.swing.ButtonGroup;
import javax.swing.JPanel;
import javax.swing.JRadioButton;

public class Footer extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -456708946790248002L;

    private ButtonGroup buttonGroup;

    public Footer() {
        this.setBackground(Color.RED);

        JRadioButton b1 = new JRadioButton("opt 1");
        JRadioButton b2 = new JRadioButton("opt 2");

        this.buttonGroup = new ButtonGroup();
        this.buttonGroup.add(b1);
        this.buttonGroup.add(b2);

        this.add(b1);
        this.add(b2);
    }
}
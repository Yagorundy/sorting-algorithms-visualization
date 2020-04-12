package src.gui.reusable;

import java.awt.Dimension;
import javax.swing.JButton;

public class Button extends JButton {
    /**
     *
     */
    private static final long serialVersionUID = -3456523689268254996L;

    public Button(String name) {
        super(name);
        Dimension size = new Dimension(300, 300);
        this.setMaximumSize(size);
        this.setPreferredSize(size);
    }
}
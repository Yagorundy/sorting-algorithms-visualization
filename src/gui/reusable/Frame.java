package src.gui.reusable;

import java.awt.Dimension;
import java.awt.Toolkit;
import javax.swing.JFrame;
import javax.swing.WindowConstants;


public class Frame extends JFrame {
    /**
     *
     */
    private static final long serialVersionUID = 4800963539511751017L;

    // App frame dimensions as decimals (compared to the screen resolution)
    private final double appWidthDecimal = 0.5;
    private final double appHeightDecimal = 0.7;

    public Frame(String name) {
        super(name);
        // setSize(getInitialWidth(), getInitialHeight());
        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
    }

    private int getInitialWidth() {
        Dimension resolution = Toolkit.getDefaultToolkit().getScreenSize();
        return (int) (resolution.getWidth() * appWidthDecimal);
    }

    private int getInitialHeight() {
        Dimension resolution = Toolkit.getDefaultToolkit().getScreenSize();
        return (int) (resolution.getHeight() * appHeightDecimal);
    }
}
package src.app;

import java.awt.*;
import javax.swing.*;

public class AppGui {
    // App frame dimensions as decimals (compared to the screen resolution)
    private final double appWidthDecimal = 0.5;
    private final double appHeightDecimal = 0.7;

    private Dimension getAppSize() {
        Dimension resolution = Toolkit.getDefaultToolkit().getScreenSize();
        resolution.setSize(resolution.getWidth() * this.appWidthDecimal,
                resolution.getHeight() * this.appHeightDecimal);
        return resolution;
    }

    private JFrame appFrame;
    private JButton sortButton;
    private JButton shuffleButton;

    public AppGui(String name) {
        this.appFrame = new JFrame(name);
        this.appFrame.setLayout(null);
        this.appFrame.setSize(this.getAppSize());
        this.appFrame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);

        this.sortButton = new JButton("Sort");
        this.sortButton.setBounds(100, 100, 300, 300);
        this.appFrame.add(this.sortButton);

        this.shuffleButton = new JButton("Shuffle");
        this.shuffleButton.setBounds(500, 500, 300, 300);
        this.appFrame.add(this.shuffleButton);

        // TODO add more elements and make ui/ux
    }
    
    public JFrame getFrame() {
        return this.appFrame;
    }

    public JButton getSortButton() {
        return this.sortButton;
    }

    public JButton getShuffleButton() {
        return this.shuffleButton;
    }
}
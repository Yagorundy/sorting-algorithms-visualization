package src.gui.components;

import java.awt.Dimension;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;

import src.gui.reusable.Button;

public class Header extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8547027486739886564L;

    private Button sortButton;
    private Button shuffleButton;

    public Header() {
        this.setLayout(new BoxLayout(this, BoxLayout.X_AXIS));

        this.sortButton = new Button("Sort");
        this.shuffleButton = new Button("Shuffle");

        this.add(this.sortButton);
        this.add(Box.createHorizontalGlue());
        this.add(this.shuffleButton);
    }

    public Button getSortButton() {
        return this.sortButton;
    }

    public Button getShuffleButton() {
        return this.shuffleButton;
    }
}
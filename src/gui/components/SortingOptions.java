package src.gui.components;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import src.gui.reusable.Button;

public class SortingOptions extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8547027486739886564L;

    private Button sortButton;
    private Button shuffleButton;

    public SortingOptions() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(50, 50, 50, 50));

        sortButton = new Button("Sort");
        shuffleButton = new Button("Shuffle");

        add(sortButton);
        add(Box.createHorizontalGlue());
        add(shuffleButton);
    }

    public Button getSortButton() {
        return sortButton;
    }

    public Button getShuffleButton() {
        return shuffleButton;
    }
}
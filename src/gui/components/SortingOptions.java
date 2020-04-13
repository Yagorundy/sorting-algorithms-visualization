package src.gui.components;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import src.gui.reusable.Button;
import src.gui.reusable.Slider;

public class SortingOptions extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8547027486739886564L;

    private Button sortButton;
    private Slider elementsSlider;
    private Button shuffleButton;

    public SortingOptions() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(50, 50, 50, 50));

        sortButton = new Button("Sort");
        elementsSlider = new Slider("Huq");
        shuffleButton = new Button("Shuffle");

        add(sortButton);
        add(Box.createHorizontalGlue());
        add(elementsSlider);
        add(Box.createHorizontalGlue());
        add(shuffleButton);
    }

    public Button getSortButton() {
        return sortButton;
    }

    public Slider getElementsSlider() {
        return elementsSlider;
    }

    public Button getShuffleButton() {
        return shuffleButton;
    }
}
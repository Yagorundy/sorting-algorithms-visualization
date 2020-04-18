package org.yagorundy.gui.components;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import org.yagorundy.gui.reusable.Button;
import org.yagorundy.gui.reusable.CheckBox;
import org.yagorundy.gui.reusable.Slider;

public class SortingOptions extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8547027486739886564L;

    private Button sortButton;
    private Slider elementsSlider;
    private CheckBox uniqueCheckBox;
    private Button shuffleButton;

    public SortingOptions() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(50, 50, 50, 50));

        sortButton = new Button("Sort");
        elementsSlider = new Slider("Huq");
        uniqueCheckBox = new CheckBox("Unique elements", true);
        shuffleButton = new Button("Shuffle");

        add(sortButton);
        add(Box.createHorizontalGlue());
        add(elementsSlider);
        add(Box.createHorizontalGlue());
        add(uniqueCheckBox);
        add(Box.createHorizontalGlue());
        add(shuffleButton);
    }

    public Button getSortButton() {
        return sortButton;
    }

    public Slider getElementsSlider() {
        return elementsSlider;
    }

    public CheckBox getUniqueCheckBox() {
        return uniqueCheckBox;
    }

    public Button getShuffleButton() {
        return shuffleButton;
    }
}

package org.yagorundy.gui.components;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;

import org.yagorundy.gui.constants.GuiConstants;
import org.yagorundy.gui.reusable.Button;
import org.yagorundy.gui.reusable.CheckBox;
import org.yagorundy.gui.reusable.Slider;

public class SortingOptions extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8547027486739886564L;

    private static final int minElements = 8;
    private static final int maxElements = 64;
    private static final int initialElements = 16;

    private static final int minSpeed = 10;
    private static final int maxSpeed = 1000;
    private static final int initialSpeed = 400;

    private Button sortButton;
    private Slider elementsSlider;
    private Slider delaySlider;
    private CheckBox uniqueCheckBox;
    private Button shuffleButton;

    public SortingOptions() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(GuiConstants.sortingOptionsBorder);

        sortButton = new Button("Sort");
        elementsSlider = new Slider(minElements, maxElements, initialElements, "Elements", 1, (maxElements - minElements) / 4);
        delaySlider = new Slider(minSpeed, maxSpeed, initialSpeed, "Delay");
        uniqueCheckBox = new CheckBox("Unique", true);
        shuffleButton = new Button("Shuffle");

        add(sortButton);
        add(Box.createHorizontalGlue());
        add(elementsSlider);
        add(Box.createHorizontalGlue());
        add(delaySlider);
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

    public Slider getDelaySlider() {
        return delaySlider;
    }

    public CheckBox getUniqueCheckBox() {
        return uniqueCheckBox;
    }

    public Button getShuffleButton() {
        return shuffleButton;
    }
}

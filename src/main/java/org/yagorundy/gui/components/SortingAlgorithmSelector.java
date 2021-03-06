package org.yagorundy.gui.components;

import java.util.Arrays;
import java.util.Optional;

import javax.swing.ButtonGroup;
import javax.swing.JPanel;

import org.yagorundy.gui.constants.GuiConstants;
import org.yagorundy.gui.reusable.RadioButton;

public class SortingAlgorithmSelector extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -456708946790248002L;

    private RadioButton[] buttons;
    private ButtonGroup buttonGroup;

    public SortingAlgorithmSelector(String[] algorithms) {
        setBorder(GuiConstants.sortingAlgorithmSelectorBorder);

        buttons = new RadioButton[algorithms.length];
        buttonGroup = new ButtonGroup();
        for (int i = 0; i < algorithms.length; i++) {
            RadioButton button = new RadioButton(algorithms[i]);
            buttons[i] = button;
            buttonGroup.add(button);
            add(button);
        }
        buttons[0].setSelected(true);
    }

    public String getSelectedButton() {
        Optional<RadioButton> button = Arrays.stream(buttons).filter(b -> b.isSelected()).findFirst();
        return button.isPresent() ? button.get().getText() : "";
    }
}

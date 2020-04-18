package main.java.gui.components;

import java.awt.Color;

import javax.swing.ButtonGroup;
import javax.swing.JPanel;
import javax.swing.JRadioButton;

public class SortingAlgorithmSelector extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = -456708946790248002L;

    private JRadioButton[] buttons;
    private ButtonGroup buttonGroup;

    public SortingAlgorithmSelector() {
        setBackground(Color.RED);
    }

    public void setAlgorithms(String[] algorithms) {
        buttons = new JRadioButton[algorithms.length];
        buttonGroup = new ButtonGroup();
        for (int i = 0; i < algorithms.length; i++) {
            JRadioButton button = new JRadioButton(algorithms[i]);
            buttons[i] = button;
            buttonGroup.add(button);
            add(button);
        }
    }

    public JRadioButton[] getButtons() {
        return buttons;
    }
}
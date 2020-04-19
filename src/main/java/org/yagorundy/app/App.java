package org.yagorundy.app;

import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;

import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import org.yagorundy.algorithms.AlgorithmService;
import org.yagorundy.gui.Gui;
import org.yagorundy.shared.Sortable;

public class App {
    private final String appName = "Sorting Algorithms Visualization";

    private AlgorithmService algorithmService;
    private Gui gui;

    public App() {
        algorithmService = new AlgorithmService();
        gui = new Gui(appName, algorithmService.getSortingAlgorithms());

        // SortingOptions events
        gui.getSortingOptions().getSortButton().addActionListener(this.onSortButtonClicked());
        gui.getSortingOptions().getElementsSlider().getSlider().addChangeListener(this.onElementsChanged());
        gui.getSortingOptions().getDelaySlider().getSlider().addChangeListener(this.onSpeedChanged());
        gui.getSortingOptions().getShuffleButton().addActionListener(this.onShuffleButtonClicked());

        // Display app
        gui.show();
    }

    private void sort() {
        String algorithmName = this.gui.getSortingAlgorithmSelector().getSelectedButton();
        Sortable sortable = this.gui.getSortingVisualization();
        long delay = this.gui.getSortingOptions().getDelaySlider().getSlider().getValue();
        algorithmService.startSorting(algorithmName, sortable, delay);
    }

    private void shuffle() {
        int elements = this.gui.getSortingOptions().getElementsSlider().getSlider().getValue();
        boolean uniqueElements = this.gui.getSortingOptions().getUniqueCheckBox().isSelected();
        this.gui.getSortingVisualization().shuffle(elements, uniqueElements);
    }

    private ActionListener onSortButtonClicked() {
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                sort();
            }
        };
    }

    private ActionListener onShuffleButtonClicked() {
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                shuffle();
            }
        };
    }

    private ChangeListener onElementsChanged() {
        return new ChangeListener() {
            public void stateChanged(ChangeEvent e) {
                shuffle();
            }
        };
    }

    private ChangeListener onSpeedChanged() {
        return new ChangeListener() {
            public void stateChanged(ChangeEvent e) {
                algorithmService.setDelay(gui.getSortingOptions().getDelaySlider().getSlider().getValue());
            }
        };
    }
}

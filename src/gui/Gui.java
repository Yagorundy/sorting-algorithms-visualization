package src.gui;

import java.awt.BorderLayout;

import src.gui.components.SortingAlgorithmSelector;
import src.gui.components.SortingOptions;
import src.gui.components.SortingVisualization;
import src.gui.reusable.Frame;

public class Gui {
    private Frame frame;

    private SortingOptions sortingOptions;
    private SortingVisualization sortingVisialization;
    private SortingAlgorithmSelector sortingAlgorithmSelector;

    public Gui(String name) {
        frame = new Frame(name);
        
        sortingOptions = new SortingOptions();
        frame.add(sortingOptions, BorderLayout.NORTH);

        sortingVisialization = new SortingVisualization();
        frame.add(sortingVisialization, BorderLayout.CENTER);

        sortingAlgorithmSelector = new SortingAlgorithmSelector();
        frame.add(sortingAlgorithmSelector, BorderLayout.SOUTH);
    }

    public Frame getFrame() {
        return frame;
    }

    public SortingOptions getSortingOptions() {
        return sortingOptions;
    }

    public SortingVisualization getSortingVisualization() {
        return sortingVisialization;
    }

    public SortingAlgorithmSelector getSortingAlgorithmSelector() {
        return sortingAlgorithmSelector;
    }
}
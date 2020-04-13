package src.gui;

import java.awt.BorderLayout;

import javax.swing.JFrame;
import javax.swing.WindowConstants;

import src.gui.components.SortingAlgorithmSelector;
import src.gui.components.SortingOptions;
import src.gui.components.SortingVisualization;

public class Gui {
    private JFrame frame;

    private SortingOptions sortingOptions;
    private SortingVisualization sortingVisialization;
    private SortingAlgorithmSelector sortingAlgorithmSelector;

    public Gui(String name) {
        frame = new JFrame(name);
        frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        
        sortingOptions = new SortingOptions();
        frame.add(sortingOptions, BorderLayout.NORTH);

        sortingVisialization = new SortingVisualization(16, true);
        frame.add(sortingVisialization, BorderLayout.CENTER);

        sortingAlgorithmSelector = new SortingAlgorithmSelector();
        frame.add(sortingAlgorithmSelector, BorderLayout.SOUTH);
    }

    public void show() {
        frame.pack();
        frame.setVisible(true);
    }

    public JFrame getFrame() {
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
package org.yagorundy.gui;

import java.awt.BorderLayout;

import javax.swing.JFrame;
import javax.swing.WindowConstants;

import org.yagorundy.gui.components.SortingAlgorithmSelector;
import org.yagorundy.gui.components.SortingOptions;
import org.yagorundy.gui.components.SortingVisualization;

public class Gui {
    private JFrame frame;

    private SortingOptions sortingOptions;
    private SortingVisualization sortingVisialization;
    private SortingAlgorithmSelector sortingAlgorithmSelector;

    public Gui(String name, String[] sortingAlgorithms) {
        frame = new JFrame(name);
        frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);

        sortingOptions = new SortingOptions();
        frame.add(sortingOptions, BorderLayout.NORTH);

        sortingVisialization = new SortingVisualization(16, true);
        frame.add(sortingVisialization, BorderLayout.CENTER);

        sortingAlgorithmSelector = new SortingAlgorithmSelector(sortingAlgorithms);
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

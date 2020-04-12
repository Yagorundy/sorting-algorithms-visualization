package src.app;

import java.util.Arrays;

import src.gui.Gui;

public class App {
    private final String appName = "Sorting Algorithms Visualization";

    private Gui gui;
    private Store store;
    
    public App() {
        gui = new Gui(appName);
        store = new Store();
        
        // Assign initial array and available sorting algorithms
        gui.getSortingVisualization().setArray(store.getArray());
        gui.getSortingAlgorithmSelector().setAlgorithms(new String[] { "BubbleSort", "QuickSort" });
        
        // SortingOptions events
        gui.getSortingOptions().getSortButton().addActionListener(store.onSortButtonClicked());
        gui.getSortingOptions().getShuffleButton().addActionListener(store.onShuffleButtonClicked(gui.getSortingVisualization()));

        // AlgorithmSelector events
        Arrays.stream(gui.getSortingAlgorithmSelector().getButtons())
            .forEach(button -> button.addActionListener(store.onAlgorithmSelected()));
        
        // Display app
        gui.getFrame().setVisible(true);
    }
}
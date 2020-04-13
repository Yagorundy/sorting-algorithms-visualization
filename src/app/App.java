package src.app;

import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import java.util.Arrays;

import src.algorithms.AlgorithmService;
import src.gui.Gui;

public class App {
    private final String appName = "Sorting Algorithms Visualization";

    private AlgorithmService algorithmService;
    private Gui gui;

    private String selectedAlgorithm;
    
    public App() {
        algorithmService = new AlgorithmService();
        gui = new Gui(appName);
        
        // Assign initial array and available sorting algorithms
        gui.getSortingAlgorithmSelector().setAlgorithms(algorithmService.getSortingAlgorithms());
        
        // SortingOptions events
        gui.getSortingOptions().getSortButton().addActionListener(this.onSortButtonClicked());
        gui.getSortingOptions().getShuffleButton().addActionListener(this.onShuffleButtonClicked());

        // AlgorithmSelector events
        Arrays.stream(gui.getSortingAlgorithmSelector().getButtons())
            .forEach(button -> button.addActionListener(this.onAlgorithmSelected()));
        
        // Display app
        gui.show();
    }

    private ActionListener onSortButtonClicked() {
        App self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println(self.selectedAlgorithm);
            }
        };
    }

    private ActionListener onShuffleButtonClicked() {
        App self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                self.gui.getSortingVisualization().shuffle(16);
            }
        };
    }

    private ActionListener onAlgorithmSelected() {
        App self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                self.selectedAlgorithm = e.getActionCommand();
            }
        };
    }
}
package src.app;

import java.awt.event.*;
import java.util.Random;

import src.gui.components.SortingVisualization;

public class Store {
    private String selectedAlgorithm;
    private int arrayLength = 30;
    private int[] array;

    Store() {
        shuffle();
    }

    private void shuffle() {
        array = new int[arrayLength];
        for (int i = 0; i < array.length; i++) {
            array[i] = i + 1;
        }

        Random random = new Random();
        for (int i = 0; i < array.length; i++) {
            int change = random.nextInt(array.length);
            
            int t = array[i];
            array[i] = array[change];
            array[change] = t;
        }
    }

    public int[] getArray() {
        return array;
    }

    public ActionListener onSortButtonClicked() {
        Store self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println(self.selectedAlgorithm);
            }
        };
    }

    public ActionListener onShuffleButtonClicked(SortingVisualization av) {
        Store self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                self.shuffle();
                av.setArray(self.array);
            }
        };
    }

    public ActionListener onAlgorithmSelected() {
        Store self = this;
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                self.selectedAlgorithm = e.getActionCommand();
            }
        };
    }
}
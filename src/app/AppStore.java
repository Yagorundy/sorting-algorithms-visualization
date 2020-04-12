package src.app;

import java.awt.event.*;

public class AppStore {
    // TODO
    private String selectedAlgorithm;
    private int arrayLength;
    private int[] array;

    AppStore() {
        // TODO
    }

    public ActionListener onSortButtonClicked() {
        return new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println("sort");
            }
        };
    }
}
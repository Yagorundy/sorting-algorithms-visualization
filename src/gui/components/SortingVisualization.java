package src.gui.components;

import java.awt.Color;
import java.util.Arrays;

import javax.swing.JPanel;

import src.gui.reusable.Rod;

public class SortingVisualization extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 7693365261886603164L;

    private final int maxRodHeight = 500;

    private Rod[] rods;

    public SortingVisualization() {
        setBackground(Color.GREEN);
    }

    public void setArray(int[] array) {
        removeAll();        

        int min = Arrays.stream(array).min().getAsInt();
        int max = Arrays.stream(array).max().getAsInt();

        rods = new Rod[array.length];
        for (int i = 0; i < array.length; i++) {
            int num = array[i];
            int height = maxRodHeight / (max - min + 1) * (num - min + 1);
            Rod rod = new Rod(height, "" + num);
            rods[i] = rod;
            add(rod);
        }

        revalidate();
        repaint();
    }
}
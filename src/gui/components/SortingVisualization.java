package src.gui.components;

import java.awt.Color;
import java.awt.Dimension;
import java.util.Arrays;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import src.gui.reusable.Rod;

public class SortingVisualization extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 7693365261886603164L;

    private final int maxRodHeight = 500;

    private static final Dimension minRodFilter = new Dimension(15, 0);
    private static final Dimension prefRodFilter = new Dimension(30, 0);
    private static final Dimension maxRodSpace = new Dimension(42069, 0);

    private Rod[] rods;

    public SortingVisualization() {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(100, 30, 100, 30));
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

            if (i != array.length - 1)
                add(new Box.Filler(minRodFilter, prefRodFilter, maxRodSpace));
        }

        revalidate();
        repaint();
    }
}
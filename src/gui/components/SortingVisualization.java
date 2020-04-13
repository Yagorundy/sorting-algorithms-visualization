package src.gui.components;

import java.awt.Color;
import java.awt.Dimension;
import java.util.Arrays;
import java.util.Random;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import src.gui.reusable.Rod;
import src.shared.Sortable;

public class SortingVisualization extends JPanel implements Sortable {
    /**
     *
     */
    private static final long serialVersionUID = 7693365261886603164L;

    private final int maxRodHeight = 1024;

    private static final Dimension minRodFilter = new Dimension(15, 0);
    private static final Dimension prefRodFilter = new Dimension(30, 0);
    private static final Dimension maxRodSpace = new Dimension(42069, 0);

    private Rod[] rods;

    public SortingVisualization(int length, boolean uniqueElements) {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(100, 30, 100, 30));
        setBackground(Color.GREEN);

        shuffle(length, uniqueElements);
    }

    private int[] generateArray(int length, boolean uniqueElements) {
        Random random = new Random();
        
        int[] array = new int[length];
        for (int i = 0; i < length; i++) {
            if (uniqueElements)
                array[i] = i + 1;
            else
                array[i] = random.nextInt(length) + 1;
        }

        for (int i = 0; i < length; i++) {
            int change = random.nextInt(length);

            int t = array[i];
            array[i] = array[change];
            array[change] = t;
        }

        return array;
    }

    public void shuffle(int length, boolean uniqueElements) {
        removeAll();

        int[] array = this.generateArray(length, uniqueElements);

        int min = Arrays.stream(array).min().getAsInt();
        int max = Arrays.stream(array).max().getAsInt();

        rods = new Rod[array.length];
        for (int i = 0; i < array.length; i++) {
            int num = array[i];
            int height = maxRodHeight / (max - min + 1) * (num - min + 1);
            Rod rod = new Rod(height, num);
            rods[i] = rod;
            add(rod);

            if (i != array.length - 1)
                add(new Box.Filler(minRodFilter, prefRodFilter, maxRodSpace));
        }

        revalidate();
        repaint();
    }

    @Override
    public int length() {
        return rods.length;
    }

    @Override
    public int get(int index, String label) {
        // TODO Auto-generated method stub
        return 0;
    }

    @Override
    public void swap(int index1, int index2) {
        // TODO Auto-generated method stub
    }
}
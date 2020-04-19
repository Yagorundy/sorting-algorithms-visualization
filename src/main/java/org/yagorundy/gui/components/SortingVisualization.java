package org.yagorundy.gui.components;

import java.awt.Color;
import java.awt.Dimension;
import java.util.Arrays;
import java.util.Random;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

import org.yagorundy.gui.reusable.Rod;
import org.yagorundy.shared.Sortable;

public class SortingVisualization extends JPanel implements Sortable {
    /**
     *
     */
    private static final long serialVersionUID = 7693365261886603164L;

    private static final int maxRodHeight = 1024;
    private static final Color defaultRodColor = Color.YELLOW;

    private static final Dimension minRodFilter = new Dimension(15, 0);
    private static final Dimension prefRodFilter = new Dimension(30, 0);
    private static final Dimension maxRodSpace = new Dimension(42069, 0);

    private Rod<Integer>[] rods;
    private int minValue;
    private int maxValue;

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

        int[] array = generateArray(length, uniqueElements);

        minValue = Arrays.stream(array).min().getAsInt();
        maxValue = Arrays.stream(array).max().getAsInt();

        rods = (Rod<Integer>[]) new Rod[array.length];
        for (int i = 0; i < array.length; i++) {
            Rod<Integer> rod = new Rod<Integer>(array[i], getRodHeight(array[i]), defaultRodColor);
            rods[i] = rod;
            add(rod);

            if (i != array.length - 1)
                add(new Box.Filler(minRodFilter, prefRodFilter, maxRodSpace));
        }

        revalidate();
        repaint();
    }

    private int getRodHeight(int value) {
        return maxRodHeight / (maxValue - minValue + 1) * (value - minValue + 1);
    }

    private void refresh() {
        for (Rod<Integer> rod : rods) rod.setHeight(getRodHeight(rod.getValue()));
    }

    @Override
    public int length() {
        return rods.length;
    }

    @Override
    public int get(int index) {
        return rods[index].getValue();
    }

    @Override
    public void set(int index, int value) {
        rods[index].setValue(value);

        if (value > maxValue) {
            maxValue = value;
            refresh();
        } else if (value < minValue) {
            minValue = value;
            refresh();
        } else {
            rods[index].setHeight(getRodHeight(value));
        }
    }

    @Override
    public void swap(int index1, int index2) {
        int t = get(index1);
        set(index1, get(index2));
        set(index2, t);
    }

    @Override
    public void markSorted(int index) {
        rods[index].setColor(Color.CYAN);
    }
}

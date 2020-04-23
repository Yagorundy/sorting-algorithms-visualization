package org.yagorundy.gui.components;

import java.awt.Color;
import java.awt.Dimension;
import java.util.Arrays;
import java.util.Random;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JPanel;

import org.yagorundy.gui.constants.GuiConstants;
import org.yagorundy.gui.reusable.Rod;
import org.yagorundy.shared.Sortable;

public class SortingVisualization extends JPanel implements Sortable {
    /**
     *
     */
    private static final long serialVersionUID = 7693365261886603164L;

    private Rod<Integer>[] rods;
    private int minValue;
    private int maxValue;

    public SortingVisualization(int length, boolean uniqueElements) {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(GuiConstants.sortingVisualizationBorder);

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
            Rod<Integer> rod = new Rod<Integer>(array[i], getRodHeight(array[i]), GuiConstants.defaultRodColor);
            rods[i] = rod;
            add(rod);

            if (i != array.length - 1)
                add(new Box.Filler(GuiConstants.minRodFilter, GuiConstants.prefRodFilter, new Dimension(42069, 0)));
        }

        revalidate();
        repaint();
    }

    private int getRodHeight(int value) {
        return GuiConstants.maxRodHeight / (maxValue - minValue + 1) * (value - minValue + 1);
    }

    private void refresh() {
        for (Rod<Integer> rod : rods)
            rod.setHeight(getRodHeight(rod.getValue()));
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

        Color tc = rods[index1].getColor();
        rods[index1].setColor(rods[index2].getColor());
        rods[index2].setColor(tc);
    }

    private void mark(Color color, int ...indexes) {
        for (int index : indexes)
            rods[index].setColor(color);
    }

    @Override
    public void markComparative(int ...indexes) {
        markComparative(false, indexes);
    }

    @Override
    public void markComparative(boolean isAlt, int ...indexes) {
        mark(isAlt ? GuiConstants.comparativeAltRodColor : GuiConstants.comparativeRodColor, indexes);
    }

    @Override
    public void markSuperlative(int ...indexes) {
        mark(GuiConstants.superlativeRodColor, indexes);
    }

    @Override
    public void markSorted(int ...indexes) {
        mark(GuiConstants.sortedRodColor, indexes);
    }

    @Override
    public void unmark(int ...indexes) {
        mark(GuiConstants.defaultRodColor, indexes);
    }
}

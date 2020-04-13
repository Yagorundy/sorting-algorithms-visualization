package src.gui.components;

import java.awt.Color;
import java.awt.Dimension;
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

    private int[] array;
    private Rod[] rods;

    public SortingVisualization(final int length) {
        setLayout(new BoxLayout(this, BoxLayout.X_AXIS));
        setBorder(new EmptyBorder(100, 30, 100, 30));
        setBackground(Color.GREEN);

        shuffle(length);
    }

    public void shuffle(final int length) {
        removeAll();

        array = new int[length];
        for (int i = 0; i < length; i++) {
            array[i] = i + 1;
        }

        final Random random = new Random();
        for (int i = 0; i < length; i++) {
            final int change = random.nextInt(length);

            final int t = array[i];
            array[i] = array[change];
            array[change] = t;
        }

        final int min = 1;
        final int max = length;

        rods = new Rod[array.length];
        for (int i = 0; i < array.length; i++) {
            final int num = array[i];
            final int height = maxRodHeight / (max - min + 1) * (num - min + 1);
            final Rod rod = new Rod(height, num);
            rods[i] = rod;
            add(rod);

            if (i != array.length - 1)
                add(new Box.Filler(minRodFilter, prefRodFilter, maxRodSpace));
        }

        revalidate();
        repaint();
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
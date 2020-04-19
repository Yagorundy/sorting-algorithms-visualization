package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class BubbleSort extends SortingAlgorithm {
    public BubbleSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        boolean swapped = false;
        int lastUnsortedIndex = sortable.length() - 1;
        do {
            swapped = false;
            for (int i = 1; i <= lastUnsortedIndex; i++) {
                if (sortable.get(i - 1) > sortable.get(i)) {
                    sortable.swap(i - 1, i);
                    swapped = true;
                }
            }
            sortable.markSorted(lastUnsortedIndex--);
            sleep();
        } while (swapped);
    }
}

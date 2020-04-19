package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class BubbleSort implements SortingAlgorithm {
    @Override
    public void sort(Sortable sortable) {
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
        } while (swapped);
    }
}

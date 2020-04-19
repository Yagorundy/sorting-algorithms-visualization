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
                sortable.markComparator(i - 1, i);
                sleep();

                if (sortable.get(i - 1) > sortable.get(i)) {
                    sortable.swap(i - 1, i);
                    swapped = true;
                    sleep();
                }
                sortable.unmark(i - 1, i);
            }
            sortable.markSorted(lastUnsortedIndex--);
            sleep();
        } while (swapped);
        unmark();
    }
}

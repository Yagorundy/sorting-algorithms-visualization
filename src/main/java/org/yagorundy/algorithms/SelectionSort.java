package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class SelectionSort extends SortingAlgorithm {
    public SelectionSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        for (int i = 0; i < sortable.length() - 1; i++) {
            int minIndex = i;
            sortable.markSuperlative(minIndex);
            sleep();

            for (int j = i + 1; j < sortable.length(); j++) {
                sortable.markComparator(j);
                sleep();

                if (sortable.get(j) < sortable.get(minIndex)) {
                    sortable.unmark(minIndex);
                    minIndex = j;
                    sortable.markSuperlative(minIndex);
                    sleep();
                } else {
                    sortable.unmark(j);
                }
            }

            sortable.markSuperlative(i);
            sleep();

            sortable.swap(i, minIndex);
            sortable.unmark(minIndex);
            sortable.markSorted(i);
            sleep();
        }
    }
}

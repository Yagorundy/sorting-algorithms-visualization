package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class InsertionSort extends SortingAlgorithm {
    public InsertionSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        sortable.markSorted(0);
        for (int i = 1; i < sortable.length(); i++) {
            int key = sortable.get(i);
            int j = i - 1;

            for (; j >= 0 && sortable.get(j) > key; j--) {
                sortable.set(j + 1, sortable.get(j));
            }
            sortable.set(j + 1, key);
            sortable.markSorted(j + 1);
        }
    }
}

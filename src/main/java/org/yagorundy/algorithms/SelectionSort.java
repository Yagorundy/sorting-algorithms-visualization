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
            for (int j = i + 1; j < sortable.length(); j++) {
                if (sortable.get(j) < sortable.get(minIndex)) {
                    minIndex = j;
                }
            }
            sortable.swap(i, minIndex);
            sortable.markSorted(i);
        }
    }
}

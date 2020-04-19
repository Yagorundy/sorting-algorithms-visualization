package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class InsertionSort implements SortingAlgorithm {
    @Override
    public void sort(Sortable sortable) {
        sortable.markSorted(0);
        for (int i = 1; i < sortable.length(); i++) {
            int key = sortable.get(i, "1");
            int j = i - 1;

            for (; j >= 0 && sortable.get(j, "2") > key; j--) {
                sortable.set(j + 1, sortable.get(j, "3"));
            }
            sortable.set(j + 1, key);
            sortable.markSorted(j + 1);
        }
    }
}

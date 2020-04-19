package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class SelectionSort implements SortingAlgorithm {
    @Override
    public void sort(Sortable sortable) {
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

package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class BubbleSort implements SortingAlgorithm {
    @Override
    public void sort(Sortable sortable) {
        for (int i = 0; i < sortable.length(); i++) {
            for (int j = 0; j < sortable.length(); j++) {
                if (sortable.get(i, "1") < sortable.get(j, "2")) {
                    sortable.swap(i, j);
                }
            }
        }
    }
}

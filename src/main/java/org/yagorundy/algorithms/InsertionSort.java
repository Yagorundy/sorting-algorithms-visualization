package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class InsertionSort extends SortingAlgorithm {
    public InsertionSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        sortable.markSorted(0);
        sleep();

        for (int i = 1; i < sortable.length(); i++) {
            int key = sortable.get(i);
            sortable.markSuperlative(i);
            sleep();

            int j = i - 1;
            while (j >= 0) {
                sortable.markComparative(j);
                sleep();

                if (sortable.get(j) > key) {
                    sortable.swap(j + 1, j);
                    sortable.markSuperlative(j);
                    sortable.markSorted(j + 1);
                    sleep();
                } else {
                    break;
                }
                j--;
            }

            for (int k = 0; k <= i; k++)
                sortable.markSorted(k);
            sleep();
        }
        unmark();
    }
}

package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class QuickSort extends SortingAlgorithm {
    public QuickSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        sort(0, sortable.length() - 1);
        unmark();
    }

    private void sort(int l, int r) {
        if (l < r) {
            int p = partition(l, r);

            sort(l, p - 1);
            sort(p + 1, r);
        } else if (l >= 0 && l < sortable.length()) {
            sortable.markSorted(l);
        }
    }

    private int partition(int l, int r) {
        int p = sortable.get(r);
        sortable.markSuperlative(r);

        int i = l;
        for (int j = l; j < r; j++) {
            boolean isSmaller = sortable.get(j) < p;
            sortable.markComparative(!isSmaller, j);
            sleep();

            if (isSmaller) {
                sortable.swap(i++, j);
                sleep();
            }
        }

        sortable.swap(i, r);
        sleep();

        for (int j = l; j <= r; j++)
            sortable.unmark(j);
        sortable.markSorted(i);
        sleep();

        return i;
    }
}

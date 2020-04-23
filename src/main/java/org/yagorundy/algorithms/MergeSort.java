package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public class MergeSort extends SortingAlgorithm {
    public MergeSort(Sortable sortable, long delay) {
        super(sortable, delay);
    }

    @Override
    public void run() {
        sort(0, sortable.length() - 1);
        unmark();
    }

    private void sort(int l, int r) {
        if (l < r) {
            int m = (l + r) / 2;

            sort(l, m);
            sort(m + 1, r);

            for (int i = l; i <= m; i++)
                sortable.markComparative(i);
            for (int i = m + 1; i <= r; i++)
                sortable.markComparative(true, i);
            sleep();

            merge(l, m, r);

            for (int i = l; i <= r; i++)
                sortable.unmark(i);
        }
    }

    private void merge(int l, int m, int r) {
        int s1 = l;
        int s2 = m + 1;

        if (sortable.get(m) <= sortable.get(s2))
            return;

        while (s1 <= m && s2 <= r) {
            if (sortable.get(s1) <= sortable.get(s2)) {
                s1++;
            } else {
                int index = s2;

                while (index != s1) {
                    sortable.swap(index, index - 1);
                    index--;
                    sleep();
                }

                s1++;
                m++;
                s2++;
            }
        }
    }
}

package org.yagorundy.algorithms;

import org.yagorundy.shared.Sortable;

public abstract class SortingAlgorithm implements Runnable {
    protected Sortable sortable;
    private long delay;

    public SortingAlgorithm(Sortable sortable, long delay) {
        this.sortable = sortable;
        this.delay = delay;
    }

    protected void sleep() {
        try {
            Thread.sleep(delay);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

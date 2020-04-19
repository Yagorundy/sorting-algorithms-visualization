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

    protected void unmark() {
        for (int i = 0; i < sortable.length(); i++)
            sortable.unmark(i);
    }

    public long getDelay() {
        return delay;
    }

    public void setDelay(long delay) {
        this.delay = delay;
    }
}

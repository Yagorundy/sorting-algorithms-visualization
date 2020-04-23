package org.yagorundy.shared;

public interface Sortable {
    public int length();

    public int get(int index);
    public void set(int index, int value);

    public void swap(int index1, int index2);

    public void markComparative(int ...indexes);
    public void markComparative(boolean isAlt, int ...indexes);

    public void markSuperlative(int ...indexes);
    public void markSorted(int ...indexes);
    public void unmark(int ...indexes);
}

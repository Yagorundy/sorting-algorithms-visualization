package org.yagorundy.shared;

public interface Sortable {
    public int length();

    public int get(int index);
    public void set(int index, int value);

    public void swap(int index1, int index2);

    public void markComparator(int ...indexes);
    public void markSuperlative(int ...indexes);
    public void markSorted(int ...indexes);
    public void unmark(int ...indexes);
}

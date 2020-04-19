package org.yagorundy.shared;

public interface Sortable {
    public int length();
    public int get(int index, String label);
    public void set(int index, int value);
    public void swap(int index1, int index2);
    public void markSorted(int index);
}

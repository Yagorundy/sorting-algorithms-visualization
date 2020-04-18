package org.yagorundy.algorithms;

import java.lang.reflect.Method;
import java.util.Set;

import org.reflections.Reflections;
import org.yagorundy.shared.Sortable;

public class AlgorithmService {
    private Set<Class<? extends SortingAlgorithm>> getSortingClasses() {
        Reflections reflections = new Reflections(this.getClass().getPackage().getName());
        return reflections.getSubTypesOf(SortingAlgorithm.class);
    }

    public String[] getSortingAlgorithms() {
        Set<Class<? extends SortingAlgorithm>> classes = this.getSortingClasses();

        String[] result = new String[classes.size()];
        int i = 0;
        for (Class<? extends SortingAlgorithm> c : classes)
            result[i++] = c.getSimpleName();
        return result;
    }

    public void startSorting(String algorithmName, Sortable sortable) {
        try {
            Class<? extends SortingAlgorithm> algorithmClass = this.getSortingClasses()
                .stream()
                .filter(c -> c.getSimpleName().equals(algorithmName))
                .findFirst()
                .get();
            Method sortingMethod = algorithmClass.getMethod("sort", new Class[] { Sortable.class });
            Object instance = algorithmClass.newInstance();
            sortingMethod.invoke(instance, new Object[] { sortable });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

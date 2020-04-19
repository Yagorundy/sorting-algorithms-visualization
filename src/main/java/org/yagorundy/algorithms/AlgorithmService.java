package org.yagorundy.algorithms;

import java.lang.reflect.Constructor;
import java.util.Set;

import org.reflections.Reflections;
import org.yagorundy.shared.Sortable;

public class AlgorithmService {
    private Thread sortingThread;

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

            Constructor<? extends SortingAlgorithm> constructor = algorithmClass.getConstructor(new Class[] { Sortable.class, long.class });
            Runnable instance = (Runnable) constructor.newInstance(new Object[] { sortable, 100L });   // TODO - remove hardcoded value

            sortingThread = new Thread(instance);
            sortingThread.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

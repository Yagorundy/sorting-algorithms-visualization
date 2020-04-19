package org.yagorundy.algorithms;

import java.lang.reflect.Constructor;
import java.util.Set;

import org.reflections.Reflections;
import org.yagorundy.shared.Sortable;

public class AlgorithmService {
    private SortingAlgorithm sortingAlgorithmInstance;
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

    public void startSorting(String algorithmName, Sortable sortable, long speed) {
        try {
            Class<? extends SortingAlgorithm> algorithmClass = this.getSortingClasses()
                .stream()
                .filter(c -> c.getSimpleName().equals(algorithmName))
                .findFirst()
                .get();

            Constructor<? extends SortingAlgorithm> constructor = algorithmClass.getConstructor(new Class[] { Sortable.class, long.class });
            sortingAlgorithmInstance = (SortingAlgorithm) constructor.newInstance(new Object[] { sortable, speed });

            sortingThread = new Thread(sortingAlgorithmInstance);
            sortingThread.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setDelay(long delay) {
        if (sortingAlgorithmInstance != null) {
            sortingAlgorithmInstance.setDelay(delay);
        }
    }
}

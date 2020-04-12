package src.app;

public class App {
    private final String appName = "Sorting Algorithms Visualization";

    private AppGui gui;
    private AppStore store;

    public App() {
        this.gui = new AppGui(appName);
        this.store = new AppStore();
        
        this.gui.getSortButton().addActionListener(store.onSortButtonClicked());
        // TODO - hook events to actions here
        
        this.gui.getFrame().setVisible(true);
    }
}
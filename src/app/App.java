package src.app;

import src.gui.Gui;

public class App {
    private final String appName = "Sorting Algorithms Visualization";

    private Gui gui;
    private AppStore store;

    public App() {
        this.gui = new Gui(appName);
        this.store = new AppStore();
        
        this.gui.getHeader().getSortButton().addActionListener(store.onSortButtonClicked());
        // TODO - hook events to actions here
        
        this.gui.getFrame().setVisible(true);
    }
}
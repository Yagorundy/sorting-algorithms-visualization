package org.yagorundy.gui.reusable;

import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSlider;

public class Slider extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8291482639060133938L;

    private static final int min = 2;
    private static final int max = 42;
    private static final int initial = 16;

    private JLabel label;
    private JSlider slider;

    public Slider(String labelText) {
        setLayout(new BoxLayout(this, BoxLayout.PAGE_AXIS));

        label = new JLabel(labelText);
        slider = new JSlider(JSlider.HORIZONTAL, min, max, initial);

        slider.setMinorTickSpacing(1);
        slider.setMajorTickSpacing((max - min) / 4);

        slider.setPaintTicks(true);
        slider.setPaintLabels(true);

        add(label);
        add(slider);
    }

    public JLabel getLabel() {
        return label;
    }

    public JSlider getSlider() {
        return slider;
    }
}

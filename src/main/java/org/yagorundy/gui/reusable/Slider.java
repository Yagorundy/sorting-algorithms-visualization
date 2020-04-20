package org.yagorundy.gui.reusable;

import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSlider;

import org.yagorundy.gui.constants.GuiConstants;

public class Slider extends JPanel {
    /**
     *
     */
    private static final long serialVersionUID = 8291482639060133938L;

    private JLabel label;
    private JSlider slider;

    public Slider(int min, int max, int initial, String labelText) {
        this(min, max, initial, labelText, 0, 0);
    }

    public Slider(int min, int max, int initial, String labelText, int minorTickSpacing, int majorTickSpacing) {
        setLayout(new BoxLayout(this, BoxLayout.PAGE_AXIS));

        label = new JLabel(labelText);
        label.setFont(GuiConstants.font);

        slider = new JSlider(JSlider.HORIZONTAL, min, max, initial);
        slider.setFont(GuiConstants.fontSmall);

        if (minorTickSpacing > 0) {
            slider.setMinorTickSpacing(1);
        }

        if (majorTickSpacing > 0) {
            slider.setMajorTickSpacing(majorTickSpacing);
        }

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

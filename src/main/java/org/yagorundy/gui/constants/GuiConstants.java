package org.yagorundy.gui.constants;

import java.awt.Dimension;
import java.awt.Font;
import java.awt.Toolkit;

public class GuiConstants {
    private static Dimension getResolution() {
        return Toolkit.getDefaultToolkit().getScreenSize();
    }

    public static final int prefWidth = (int) Math.ceil(getResolution().getWidth() * 0.6);
    public static final int prefHeight = (int) Math.ceil(getResolution().getHeight() * 0.85);

    public static final Font font = new Font("TimesNewRoman", Font.PLAIN, 40);

    public static final Dimension buttonSize = new Dimension((int) Math.ceil(prefWidth * 0.1), (int) Math.ceil(prefHeight * 0.07));
    public static final Dimension checkBoxSize = new Dimension((int) Math.ceil(prefWidth * 0.1), (int) Math.ceil(prefHeight * 0.07));

    public static final int maxRodHeight = (int) Math.ceil(prefHeight * 0.7);

    public static final int prefRodWidth = (int) Math.ceil(prefWidth * 0.03);
    public static final int maxRodWidth = (int) Math.ceil(prefWidth * 0.05);
}

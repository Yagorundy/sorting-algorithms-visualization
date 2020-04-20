package org.yagorundy.gui.constants;

import java.awt.Color;
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
    public static final Font fontSmall = new Font("TimesNewRoman", Font.PLAIN, 20);

    public static final Dimension buttonSize = new Dimension((int) Math.ceil(prefWidth * 0.1), (int) Math.ceil(prefHeight * 0.07));
    public static final Dimension checkBoxSize = new Dimension((int) Math.ceil(prefWidth * 0.1), (int) Math.ceil(prefHeight * 0.07));
    public static final Dimension radioButtonSize = new Dimension((int) Math.ceil(prefWidth * 0.15), (int) Math.ceil(prefHeight * 0.05));

    public static final int maxRodHeight = (int) Math.ceil(prefHeight * 0.7);

    public static final int prefRodWidth = (int) Math.ceil(prefWidth * 0.03);
    public static final int maxRodWidth = (int) Math.ceil(prefWidth * 0.05);

    public static final Dimension minRodFilter = new Dimension((int) Math.ceil(prefRodWidth * 0.2), 0);
    public static final Dimension prefRodFilter = new Dimension((int) Math.ceil(prefRodWidth * 0.6), 0);

    public static final Color defaultRodColor = new Color(173, 216, 230);
    public static final Color comparativeRodColor = new Color(255, 191, 0);
    public static final Color comparativeAltRodColor = new Color(4, 128, 254);
    public static final Color superlativeRodColor = Color.RED;
    public static final Color sortedRodColor = new Color(0, 128, 0);
}

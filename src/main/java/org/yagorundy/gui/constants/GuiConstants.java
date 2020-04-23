package org.yagorundy.gui.constants;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Toolkit;

import javax.swing.border.EmptyBorder;

public class GuiConstants {
    private static int dec(double value, double decimal) {
        return dec((int) Math.ceil(value), decimal);
    }
    private static int dec(int value, double decimal) {
        return (int) Math.ceil(value * decimal);
    }

    private static Dimension getResolution() {
        return Toolkit.getDefaultToolkit().getScreenSize();
    }

    public static final int prefWidth = dec(getResolution().getWidth(), 0.6);
    public static final int prefHeight = dec(getResolution().getHeight(), 0.85);

    public static final Font font = new Font("TimesNewRoman", Font.PLAIN, dec(prefHeight, 0.02));
    public static final Font fontSmall = new Font("TimesNewRoman", Font.PLAIN, dec(prefHeight, 0.012));

    public static final EmptyBorder sortingOptionsBorder = new EmptyBorder(dec(prefHeight, 0.03), dec(prefWidth, 0.05), dec(prefHeight, 0.03), dec(prefHeight, 0.06));
    public static final EmptyBorder sortingVisualizationBorder = new EmptyBorder(dec(prefHeight, 0.03), dec(prefWidth, 0.02), dec(prefHeight, 0.03), dec(prefWidth, 0.02));
    public static final EmptyBorder sortingAlgorithmSelectorBorder = new EmptyBorder(dec(prefHeight, 0.03), dec(prefWidth, 0.03) , dec(prefHeight, 0.03), dec(prefWidth, 0.03));

    public static final Dimension buttonSize = new Dimension(dec(prefWidth, 0.1), dec(prefHeight, 0.07));
    public static final Dimension checkBoxSize = new Dimension(dec(prefWidth, 0.1), dec(prefHeight, 0.07));
    public static final Dimension radioButtonSize = new Dimension(dec(prefWidth, 0.15), dec(prefHeight, 0.05));

    public static final int maxRodHeight = dec(prefHeight, 0.7);

    public static final int prefRodWidth = dec(prefWidth, 0.04);
    public static final int maxRodWidth = dec(prefWidth, 0.06);

    public static final Dimension minRodFilter = new Dimension(dec(prefRodWidth, 0.2), 0);
    public static final Dimension prefRodFilter = new Dimension(dec(prefRodWidth, 0.6), 0);

    public static final Color defaultRodColor = new Color(173, 216, 230);
    public static final Color comparativeRodColor = new Color(255, 191, 0);
    public static final Color comparativeAltRodColor = new Color(4, 128, 254);
    public static final Color superlativeRodColor = Color.RED;
    public static final Color sortedRodColor = new Color(0, 128, 0);
}

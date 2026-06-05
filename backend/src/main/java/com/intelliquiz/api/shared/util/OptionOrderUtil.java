package com.intelliquiz.api.shared.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Deterministic option permutation for participant-facing MCQ displays.
 * The same team/question pair always receives the same shuffle order.
 */
public final class OptionOrderUtil {

    private OptionOrderUtil() {
    }

    public static long shuffleSeed(long teamId, long questionId) {
        return teamId * 31L + questionId;
    }

    /**
     * Returns permutation[displayIndex] = originalIndex.
     */
    public static int[] createPermutation(int size, long seed) {
        int[] permutation = new int[size];
        for (int i = 0; i < size; i++) {
            permutation[i] = i;
        }
        if (size <= 1) {
            return permutation;
        }

        List<Integer> indices = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            indices.add(i);
        }
        Collections.shuffle(indices, new Random(seed));
        for (int i = 0; i < size; i++) {
            permutation[i] = indices.get(i);
        }
        return permutation;
    }

    public static int displayToOriginal(int displayIndex, int[] permutation) {
        if (displayIndex < 0 || displayIndex >= permutation.length) {
            return displayIndex;
        }
        return permutation[displayIndex];
    }

    public static int originalToDisplay(int originalIndex, int[] permutation) {
        for (int displayIndex = 0; displayIndex < permutation.length; displayIndex++) {
            if (permutation[displayIndex] == originalIndex) {
                return displayIndex;
            }
        }
        return originalIndex;
    }

    public static List<String> applyPermutation(List<String> options, int[] permutation) {
        List<String> shuffled = new ArrayList<>(permutation.length);
        for (int originalIndex : permutation) {
            shuffled.add(options.get(originalIndex));
        }
        return shuffled;
    }
}

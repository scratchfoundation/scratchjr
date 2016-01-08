package org.scratchjr.android;

import junit.framework.Assert;

import java.util.concurrent.Callable;

/**
 * Common utilities for unit tests
 */
public final class TestUtils {
    static final int TIMEOUT = 2000;

    /** Utility class constructor */
    private TestUtils() {
    }

    /**
     * Waits until the given callable returns true, or if a timeout occurrs, fail the test.
     */
    static void waitUntilTrue(final Callable<Boolean> callable)
        throws Exception
    {
        waitForCondition(new Condition<Boolean>() {
            @Override
            public Boolean call() throws Exception {
                return callable.call();
            }

            @Override
            boolean conditionReady(Boolean value) {
                return (value != null) && value;
            }
        });
    }

    static <V> V waitForCondition(Condition<V> condition)
        throws Exception
    {
        long timeout = System.currentTimeMillis() + TIMEOUT;
        V result;
        result = condition.call();
        while (!condition.conditionReady(result) && (System.currentTimeMillis() < timeout)) {
            Thread.sleep(10);
            result = condition.call();
        }
        if (!condition.conditionReady(result)) {
            Assert.fail("Timed out waiting for condition");
        }
        return result;
    }

    static <V> V ensureConditionDoesNotHappenWithinTimeout(Condition<V> condition)
        throws Exception
    {
        long timeout = System.currentTimeMillis() + TIMEOUT;
        V result;
        result = condition.call();
        while (!condition.conditionReady(result) && (System.currentTimeMillis() < timeout)) {
            Thread.sleep(10);
            result = condition.call();
        }
        if (condition.conditionReady(result)) {
            Assert.fail("Unexpected condition occurred within timeout");
        }
        return result;
    }

    abstract static class Condition<V>
        implements Callable<V>
    {
        /**
         * Return true if the condition is ready to be analyzed.
         * Defaults to returning true when the value is not null but can be overridden.
         */
        boolean conditionReady(V value) {
            return value != null;
        }
    }
}

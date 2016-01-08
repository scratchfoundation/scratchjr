package org.scratchjr.android;

/**
 * Exception thrown when there was a problem connecting to or accessing the database.
 * 
 * @author markroth8
 */
public class DatabaseException
    extends Exception
{
    private static final long serialVersionUID = 2762109849013951310L;

    public DatabaseException(String message) {
        super(message);
    }

    public DatabaseException(String message, Throwable t) {
        super(message, t);
    }

    public DatabaseException(Throwable t) {
        super(t);
    }

}

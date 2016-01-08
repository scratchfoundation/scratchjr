/** Error codes in Greenhouse error domain. */
typedef enum {
  /**
   * Operation succeeded.
   */
  kGGLErrorCodeSucceeded = 0,
  /**
   * Default failure error code. This is a catch all error and indicates something has gone very
   * wrong. There is no remediation for this case.
   **/
  kGGLErrorCodeUnknownFailure = -1,

  /**
   * Indicates that the calling method did not do anything in response to the call. This occurs in
   * situations where the caller asked state to be mutated into its current state or selector wasn't
   * present but it isn't considered a critical failure..
   */
  kGGLErrorCodeNoOp = -2,

  // 100 series codes are for GGLIdentity
  /**
   * Sign In was cancelled before completion. This indicates that the user cancelled login. If
   * non-login users are supported receiving this error code should start that flow.
   **/
  kGGLErrorCodeSignInCancelled = -100,

  /**
   * Sign in failed due to the e-mail returned by the provider did not match the one inputted by
   * the user. This indicates some sort of issue with the identity provider. Possibly the user is
   * using an alias for the email that they created the account with. This is likely a permanent
   * failure without remediation by the identity provider. The provided UI does not indicate the
   * failure to the user, so it is the responsibility of the caller to communicate this reason for
   * failure to the user.
   */
  kGGLErrorCodeEmailMismatch = -101,

  /**
   * Sign in failed due to the user attempting to create a new account with an e-mail that is
   * already associated with an account. The provided UI does not indicate the failure to the user,
   * so it is the responsibility of the caller to communicate this reason for failure to the user.
   */
  kGGLErrorCodeEmailExists = -102,

  /**
   * Sign in failed due to an unexpected response during sign in process. This may or may not be a
   * transitory error, so on first occurrence it is reasonable to attempt again. If it is
   * consistently occurring it may indicate that the identity provider is not available, check the
   * internet connection.
   */
  kGGLErrorCodeUnexpectedResponse = -103,

  /**
   * Indicates the session is not stored locally.
   */
  kGGLErrorCodeSessionNotStored = -104,

  /**
   * The user cannot sign in silently without a user interface.
   */
  kGGLErrorCodeCannotSignInSilently = -105,

  // 200 series error codes are for GGLContext
  /**
   * Configuration of one of the requested subspecs failed. Additional details on what failed and
   * why it failed should appear in the log.
   */
  kGGLErrorCodeFeatureSubspecConfigFailed = -200,

  /**
   * Loading data from the GoogleService-Info.plist file failed. This is a fatal error and should
   * not be ignored. Further calls to the API will fail and/or possibly cause crashes.
   */
  kGGLErrorCodeInvalidPlistFile = -200
} GGLErrorCode;

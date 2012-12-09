class Cfg:
    def __init__(self):
        self.connection_string = 'austin/Hell0Sql@queequeg/xe'
        self.app_user_connection_string = 'linkalator/hEracl3s@queequeg/xe'
        self.log_detail = "Request url: {!s}; Method: {!s}; Returned status code: {!s}"

    ## Database connection string
    lnk_connection_string = 'linkalator/hEracl3s@192.168.1.136/xe'

    ## Constants
    const_log_detail = "Request url: {!s}; Method: {!s}; Returned status code: {!s}"
    http_prefix = 'http://'

    ## Session keys
    requested_page_id = 'requested_page_id'
    current_page_id = 'current_page_id'
    current_user_id = 'current_user_id'
    current_user_name = 'current_user_name'
    current_session_id = 'current_user_session_id'
    logged_in = 'logged_in'

    ## Form constants
    username_field = 'username'
    password_field = 'password'

    ## Database return values

    user_already_exists = -1
    invalid_password = -1
    no_user_exists = -2

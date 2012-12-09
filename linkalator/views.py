from linkalator import app
import flask
from util import DataLayer
from cfg import Cfg
import logging

#define the log file and message format
file_handler = logging.FileHandler('app.log')
formatter = logging.Formatter('%(asctime)s | Level: %(levelname)s | Message: %(message)s')
file_handler.setFormatter(formatter)

#initialize our flask app and add logging configuration
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)


def get_project_source():
    return flask.redirect(flask.url_for('static', filename = 'linkalator_project.zip'))


def show_link_page(page_id):
    if not flask.session.get(Cfg.logged_in):
        flask.session[Cfg.requested_page_id] = page_id
        return flask.redirect(flask.url_for('login'))
    dl = DataLayer()
    requested_page_id = int(flask.session[Cfg.requested_page_id])
    current_page_id = int(page_id)

    # Only change current page in DB if user is not being redirected here from login
    if not requested_page_id == page_id:
        session_id = int(flask.session[Cfg.current_session_id])
        links = dl.get_links(current_page_id, session_id)
    else:
        links = dl.get_links(current_page_id)
    for l in links:
        app.logger.info('link href: {!s}'.format(l.href))
    flask.session[Cfg.current_page_id] = current_page_id
    return flask.render_template('show_links.html', links = links)


def add_page():
    if not flask.session.get(Cfg.logged_in):
        flask.abort(401)
    dl = DataLayer()
    page_title = flask.request.form['title']
    current_user_id = int(flask.session[Cfg.current_user_id])
    new_page_id = dl.add_page(current_user_id, page_title)
    flask.flash('Welcome to {!s}!'.format(page_title))
    return flask.redirect(flask.url_for('show_link_page', page_id = new_page_id))


def add_link():
    if not flask.session.get(Cfg.logged_in):
        flask.abort(401)
    dl = DataLayer()
    display_text, href = flask.request.form['title'], flask.request.form['text']
    current_user_id = int(flask.session[Cfg.current_user_id])
    host_page_id = int(flask.session[Cfg.current_page_id])
    dl.add_link(host_page_id, display_text, href, current_user_id)
    flask.flash('New link was successfully posted')
    return flask.redirect(flask.url_for('show_link_page', page_id = host_page_id))


def remove_link(link_id):
    if not flask.session.get(Cfg.logged_in):
        flask.abort(401)
    dl = DataLayer()
    dl.deactivate_link(int(link_id))
    return flask.jsonify({"message" : "link {!s} deactivated".format(link_id)})


def increment_click(link_id):
    try:
        if not flask.session.get(Cfg.logged_in):
            flask.abort(401)
        dl = DataLayer()
        dl.increment_click_count(link_id)
        return flask.jsonify({"message" : "link {!s} click count incremented by 1".format(link_id)})
    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)


def index():
    pages = []   
    try:        
        dl = DataLayer()
        pages = dl.get_pages()

    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)

    finally:
        return flask.render_template('index.html', pages = pages)


def statistics():
    users = []
    gateway_totals = []
    top_entry_totals = []
    link_stats = []
    session_users = []
    top_users = []

    try:
        dl = DataLayer()
        stats = dl.get_statistics()
        users = stats['users']
        gateway_totals = stats['gateway_totals']
        top_entry_totals = stats['top_entry_totals']
        link_stats = stats['link_stats']
        session_users = stats['session_users']
        top_users = stats['top_users']

        return flask.render_template('stats.html', users = users, gateway_totals = gateway_totals, \
            top_entry_totals = top_entry_totals, link_stats = link_stats, session_users = session_users, \
            top_users = top_users)

    except Exception:
        stat_code = 500
        ld = Cfg.const_log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)
        return flask.render_template('login.html', error = 'Problem loading page...')


def login():
    error = None
    try:
        if flask.request.method == 'POST':
            user_name = str(flask.request.form[Cfg.username_field])
            password = str(flask.request.form[Cfg.password_field])
            dl = DataLayer()   
            user_id = dl.validate_user(user_name, password)

            # DB will return negative number codes if user credentials are invalid
            if user_id == Cfg.invalid_password:
                error = 'Invalid password'
                return flask.render_template('login.html', error = error)
            elif user_id == Cfg.no_user_exists:
                error = 'No user record exists for {!s}. Would you like to register?'.format(user_name)
                return flask.render_template('login.html', error = error)
            else:
                # User is valid; DB returned a real User ID
                flask.session[Cfg.logged_in] = True
                flask.session[Cfg.current_user_name] = user_name
                user_id = int(user_id)
                flask.session[Cfg.current_user_id] = user_id
                flask.flash('You were logged in')

                # User hasn't requested a specific page; redirect them to site index 
                if not flask.session.get(Cfg.requested_page_id):
                    low_page_id = dl.get_lowest_page_id()
                    flask.session[Cfg.requested_page_id] = low_page_id
                    app.logger.info('lowest page id: {!s}'.format(low_page_id))
                    session_id = dl.start_user_session(user_id, low_page_id)
                    flask.session[Cfg.current_session_id] = session_id
                    app.logger.info('user_id: {!s}, requested_page_id: {!s}, session_id: {!s}'\
                        .format(user_id, low_page_id, session_id))
                    return flask.redirect(flask.url_for('index'))  

                # Take the user where they want to go
                else:
                    requested_page_id = int(flask.session[Cfg.requested_page_id])
                    session_id = dl.start_user_session(user_id, requested_page_id)
                    flask.session[Cfg.current_session_id] = session_id
                    app.logger.info('user_id: {!s}, requested_page_id {!s}'.format(user_id, requested_page_id))
                    return dl.get_requested_page(requested_page_id)
        else:
            return flask.render_template('login.html')

    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)
        return flask.render_template('login.html', error = error)


def logout():
    try:        
        dl = DataLayer()
        dl.end_user_session()
        flask.flash('You were logged out')
        return flask.redirect(flask.url_for('index'))

    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)


def register_user():
    try:
        if flask.request.method == 'POST':
            user_name = str(flask.request.form[Cfg.username_field])
            password = str(flask.request.form[Cfg.password_field])
            dl = DataLayer()
            user_id = dl.create_user(user_name, password)
                
            # DB will return an error code if the user name is not available,
            # otherwise, record the new session ID and route user to site index
            #! TODO: there's a bug here -- index may not necessarily be the page with the lowest ID !#
            if not user_id == Cfg.user_already_exists:
                low_page_id = dl.get_lowest_page_id()
                flask.session[Cfg.requested_page_id] = low_page_id
                app.logger.info('lowest page id: {!s}'.format(low_page_id))
                session_id = dl.start_user_session(user_id, low_page_id)
                flask.session[Cfg.current_session_id] = session_id
                flask.session[Cfg.current_user_name] = user_name
                flask.session[Cfg.current_user_id] = user_id
                flask.session[Cfg.logged_in] = True
                app.logger.info('user_id: {!s}, requested_page_id: {!s}, session_id: {!s}'\
                    .format(user_id, low_page_id, session_id))
                return flask.redirect(flask.url_for('index'))
            else:
                return flask.render_template('register.html', error = 'A user with the name "{!s}" already exists. Please choose \
                    another username and try again.'.format(user_name))
        else:
            return flask.render_template('register.html')

    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)      



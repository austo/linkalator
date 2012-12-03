from linkalator import app
import flask
from agent import Agent
from util import DataLayer
from cfg import Cfg
import logging
from flask.ext.login import (login_user, logout_user, login_required,
                            confirm_login, fresh_login_required)

#define the log file and message format
file_handler = logging.FileHandler('app.log')
formatter = logging.Formatter('%(asctime)s | Level: %(levelname)s | Message: %(message)s')
file_handler.setFormatter(formatter)

#initialize our flask app and add logging configuration
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)

def api_agents():
    dl = DataLayer()
    response = ""
    stat_code = 200
    ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)

    try:
        if flask.request.method == 'GET':       
            res = dl.execute_select('select aid, aname, city, percent from system.agents order by aid')
            agents = []
            for r in res:
                a = Agent(r[0], r[1], r[2], r[3])
                agents.append(a.__dict__)
            response = flask.jsonify({"agents" : agents})
        elif flask.request.method == 'POST':
            blah = flask.session.get('logged_in')
            #TODO: update agents
            if not flask.session.get('logged_in'):
                flask.session['logged_in'] = True
                response = flask.jsonify({"JSON Message" : "you were just logged in", "original session status" : blah,  "session login status" : flask.session['logged_in']})
            elif flask.session['logged_in']:
                response = flask.jsonify({"JSON Message" : "you were already logged in"})
        app.logger.info(ld)

    except Exception:
        stat_code = 500
        ld = Cfg().log_detail.format(flask.request.url, flask.request.method, stat_code)
        app.logger.exception(ld)
        response = flask.jsonify({"error": "internal server error."})

    finally:
        response.status_code = stat_code
        return response


def site_main():
    return flask.render_template('main.html')


def say_hello(username):
    """Contrived example to demonstrate Flask's url routing capabilities"""
    return 'Hello %s' % username

def show_entries():
    con_string = Cfg().app_user_connection_string
    dl = DataLayer(con_string)
    res = dl.get_links()
    entries = [dict(title = r[1], text = r[2]) for r in res]
    return flask.render_template('show_entries.html', entries=entries)

def add_entry():
    if not flask.session.get('logged_in'):
        flask.abort(401)
    con_string = Cfg().app_user_connection_string
    dl = DataLayer(con_string)
    display_text, href = flask.request.form['title'], flask.request.form['text']
    dl.add_link(1, display_text, href)
    flask.flash('New entry was successfully posted')
    return flask.redirect(flask.url_for('show_entries'))


def login():
    error = None
    if flask.request.method == 'POST':
        if flask.request.form['username'] != app.config['USERNAME']:
            error = 'Invalid username'
        elif flask.request.form['password'] != app.config['PASSWORD']:
            error = 'Invalid password'
        else:
            flask.session['logged_in'] = True
            flask.flash('You were logged in')
            return flask.redirect(flask.url_for('show_entries'))
    return flask.render_template('login.html', error=error)


def logout():
    flask.session.pop('logged_in', None)
    flask.flash('You were logged out')
    return flask.redirect(flask.url_for('show_entries'))


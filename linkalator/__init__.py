import flask


#TODO: login/logout, create/remove user, create/remove page, create/remove link

#initialize our flask app
app = flask.Flask(__name__)
app.config.from_pyfile('settings.py')
import urls
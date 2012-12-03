"""
urls.py

URL dispatch route mappings and error handlers

"""

from flask import render_template
from linkalator import app
from linkalator import views


## URL dispatch rules
# App Engine warm up handler
# See http://code.google.com/appengine/docs/python/config/appconfig.html#Warming_Requests
#app.add_url_rule('/_ah/warmup', 'warmup', view_func=views.warmup)

# Home page
#app.add_url_rule('/', 'home', view_func=views.home)

# Say hello
app.add_url_rule('/hello/<username>', 'say_hello', view_func=views.say_hello)
app.add_url_rule('/main', 'site_main', view_func=views.site_main)
app.add_url_rule('/agents', 'api_agents', view_func=views.api_agents, methods = ["GET", "POST"])
app.add_url_rule('/login', 'login', view_func=views.login, methods=['GET', 'POST'])
app.add_url_rule('/logout', 'logout', view_func=views.logout)
app.add_url_rule('/', 'show_entries', view_func=views.show_entries)
app.add_url_rule('/add', "add_entry", view_func=views.add_entry, methods=['POST'])




# Examples list page
#app.add_url_rule('/examples', 'list_examples', view_func=views.list_examples, methods=['GET', 'POST'])

# Contrived admin-only view example
#app.add_url_rule('/admin_only', 'admin_only', view_func=views.admin_only)

# Delete an example (post method only)
#app.add_url_rule('/examples/delete/<int:example_id>', view_func=views.delete_example, methods=['POST'])


## Error handlers
# Handle 404 errors
# @app.errorhandler(404)
# def page_not_found(e):
#     return render_template('404.html'), 404

# # Handle 500 errors
# @app.errorhandler(500)
# def server_error(e):
#     return render_template('500.html'), 500


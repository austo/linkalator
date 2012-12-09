"""
urls.py
URL dispatch route mappings and error handlers

"""

from flask import render_template
from linkalator import app
from linkalator import views


app.add_url_rule('/login', 'login', view_func = views.login, methods=['GET', 'POST'])
app.add_url_rule('/logout', 'logout', view_func = views.logout, methods=['GET'])
app.add_url_rule('/stats', 'statistics', view_func = views.statistics, methods = ['GET'])
app.add_url_rule('/source', 'get_project_source', view_func = views.get_project_source, methods = ['GET'])
app.add_url_rule('/register', 'register', view_func = views.register_user, methods = ['GET', 'POST'])

#NOTE: Index page currently does not count as requested page
app.add_url_rule('/', 'index', view_func = views.index, methods = ['GET', 'POST'])
app.add_url_rule('/page/<page_id>', 'show_link_page', view_func = views.show_link_page)
# app.add_url_rule('/link/new')
app.add_url_rule('/link/add', "add_link", view_func=views.add_link, methods=['POST'])
app.add_url_rule('/link/remove/<link_id>', 'remove_link', view_func = views.remove_link, methods=['POST'])
app.add_url_rule('/page/add', 'add_page', view_func = views.add_page, methods = ['POST'])
app.add_url_rule('/click/<link_id>', 'increment_click', view_func = views.increment_click, methods=['POST'])

## Error handlers
# Handle 404 errors
# @app.errorhandler(404)
# def page_not_found(e):
#     return render_template('404.html'), 404

# # Handle 500 errors
# @app.errorhandler(500)
# def server_error(e):
#     return render_template('500.html'), 500


import daemon
from linkalator import app
from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

with daemon.DaemonContext():
	http_server = HTTPServer(WSGIContainer(app))
	http_server.listen(603)
	IOLoop.instance().start()

# app.run('0.0.0.0')

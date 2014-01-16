import os

from tornado import ioloop, web, websocket, httpserver
#example from: http://www.tornadoweb.org/en/stable/websocket.html


class WSHandler(websocket.WebSocketHandler):
    def on_message(self, message):  # handle incoming messages
        print "Message from client:", message


if __name__ == "__main__":
    print "Visit: 127.0.0.1:8080/static/index.html"
    pwd = os.path.abspath(os.path.dirname(__file__))

    application = web.Application([
            (r'/static/(.*)', web.StaticFileHandler, {'path': pwd}),
            (r"/send-hello",WSHandler) ])

    application.listen(8080)
    ioloop.IOLoop.instance().start()

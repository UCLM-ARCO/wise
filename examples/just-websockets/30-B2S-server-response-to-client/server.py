import os
import datetime

from tornado import ioloop, web, websocket


class WSHandler(websocket.WebSocketHandler):
    def open(self):
        self.counter = 0
        ioloop.IOLoop.instance().add_timeout(datetime.timedelta(seconds=1), self.send_message)

    def send_message(self):
        self.counter += 1
        self.write_message("Hello Client " + str(self.counter))
        ioloop.IOLoop.instance().add_timeout(datetime.timedelta(seconds=1), self.send_message)

    def on_message(self, message):  # handle incoming messages
        print "Message from client:", message

    def on_close(self):  # handle closed connections
        print "WebSocket closed"

if __name__ == "__main__":
    """This example want to show how to make an invocation from
    Browser to server """
    print "Visit: http://127.0.0.1:8080/static/index.html"
    pwd = os.path.abspath(os.path.dirname(__file__))

    application = web.Application([
            (r'/static/(.*)', web.StaticFileHandler, {'path': pwd}),
            (r"/send-hello",WSHandler) ])
    application.listen(8080)
    ioloop.IOLoop.instance().start()

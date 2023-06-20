from waitress import serve
from webbrowser import open_new_tab
from os.path import realpath
from backend.app import app


# open frontend in new tab and start api server
if __name__ == "__main__":
    open_new_tab('file://' + realpath('./frontend/build/index.html'))
    serve(app, host="0.0.0.0", port=8922, clear_untrusted_proxy_headers=False)
from flask import url_for
from cfg import Cfg

class Agent:
	def __init__(self, id = 0, name = "", city = "", commission = 0.0):
		self.id = id
		self.name = name
		self.city = city
		self.commission = commission

class Link:
    def __init__(self, id, display_text, href):
        self.id = id
        self.display_text = display_text
        self.href = Cfg.http_prefix + href.replace(Cfg.http_prefix, "")

class Link_stat:
    def __init__(self, name, host_page_name, href, access_count):
        self.name = name
        self.host_page_name = host_page_name
        self.href = Cfg.http_prefix + href.replace(Cfg.http_prefix, "")
        self.access_count = int(access_count)

class Page:
    def __init__(self, id, title):
        self.id = id
        self.title = str(title)
        self.href = url_for('show_link_page', page_id = id)

class Page_gateway_total:
    def __init__(self, name, entry_count, exit_count):
        self.name = name
        self.entry_count = entry_count
        self.exit_count = exit_count

class Current_page_user:
    def __init__(self, id, name, current_page_id, current_page_name):
        self.id = id
        self.name = name
        self.current_page_id = current_page_id
        self.current_page_name = current_page_name


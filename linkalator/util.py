import cx_Oracle
from cfg import Cfg
from data_classes import Link, Link_stat, Page, Page_gateway_total, Current_page_user 
from flask import url_for, session, redirect, app


#NOTE: for new items, use JavaScript to insert a tolken value into the ID of the object in question,
#   then decide whether to insert or update by presence of tolken.
#   The only issue will be insertion of valid ID's into new objects, thus overwriting valid old ones

class DataLayer:
    def __init__(self, connection_string = 'default'):
        if connection_string == 'default':
            self.connection_string = Cfg.lnk_connection_string
        else:
            self.connection_string = connection_string


    def get_connection(self):
        self.con = cx_Oracle.connect(self.connection_string)


    def execute_select(self, select):
        self.get_connection()
        cur = self.con.cursor()
        cur.execute(select)
        res = cur.fetchall()
        self.con.close()
        return res

    # where agents is an array of agent tuples
    def insert_agents(self, agents):
        self.get_connection()
        self.cur = self.con.cursor()
        self.cur.bindarraysize = len(agents)
        rows = self.unpack_agents(agents)
        self.cur.setinputsizes(int, 20)
        self.cur.executemany("insert into system.agents(aid, aname, city, percent) values (:1, :2, :3, :4)", rows)
        self.con.commit()


    def unpack_agents(self, agents):
        tupleVals = []
        for a in agents:
            t = (a.id, a.name, a.city, a.commission)
            tupleVals.append(t)
        return tupleVals


    def get_links(self, host_page_id, session_id = -999):
        self.get_connection()
        cur = self.con.cursor()
        cur.prepare('select link_id, display_text, href from links where host_page_id = :id and active = 1')
        cur.execute(None, {'id': int(host_page_id)})
        res = cur.fetchall()
        links = []
        for r in res:
            l = Link(r[0], r[1], r[2])
            links.append(l)
        if not session_id == -999:
            self.change_current_page(cur, host_page_id, session_id)
        cur.close()
        self.con.close()
        return links


    def get_pages(self):
        self.get_connection()
        cur = self.con.cursor()
        cur.execute('select page_id, title from linkalator.pages where active = 1')
        res = cur.fetchall()
        pages = []
        for r in res:
            p = Page(r[0], r[1])
            pages.append(p)
        cur.close()
        self.con.close()
        return pages


    def get_lowest_page_id(self):
        self.get_connection()
        cur = self.con.cursor()
        cur.execute('select min(page_id) from linkalator.pages where active = 1')
        id = cur.fetchone()
        ret_val = id[0]
        cur.close()
        self.con.close()
        return ret_val


    def get_requested_page(self, page_id):
        return redirect(url_for('show_link_page', page_id = page_id))




# DB views utility methods
#-------------------------------------------------------------------------------------------------#

    def get_statistics(self):
        self.get_connection()
        cur = self.con.cursor()
        ret_val = {}
        ret_val['users'] = self.get_current_page_users(cur)
        ret_val['gateway_totals'] = self.get_page_gateway_totals(cur)
        ret_val['top_entry_totals'] = self.get_top_entry_pages(cur)
        ret_val['link_stats'] = self.get_link_stats(cur)
        ret_val['session_users'] =  self.get_user_access_totals(cur)
        ret_val['top_users'] = self.get_top_users(cur)
        cur.close()
        self.con.close()
        return ret_val

    def get_current_page_users(self, cur):
        cur.execute('select user_id, user_name, current_page_id, current_page_name from linkalator.current_page_users')
        res = cur.fetchall()
        users = []
        for r in res:
            u = Current_page_user(r[0], r[1], r[2], r[3])
            users.append(u)
        return users

    def get_link_stats(self, cur):
        cur.execute('select link_name, host_page_name, link_to_address, access_count from linkalator.link_stats')
        res = cur.fetchall()
        link_stats = []
        for r in res:
            ls = Link_stat(r[0], r[1], r[2], r[3])
            link_stats.append(ls)
        return link_stats 


    def get_page_gateway_totals(self, cur):
        cur.execute('select page_name, entry_count, exit_count from linkalator.page_gateway_totals')
        res = cur.fetchall()
        gateway_totals = []
        for r in res:
            gt = Page_gateway_total(r[0], r[1], r[2])
            gateway_totals.append(gt)
        return gateway_totals


    def get_top_entry_pages(self, cur):
        top_entry_totals = []
        cur.execute('select page_name, entry_count from linkalator.top_entry_pages')
        top_entry_totals = [dict(page_name = row[0], entry_count = row[1]) for row in cur.fetchall()]        
        return top_entry_totals


    def get_user_access_totals(self, cur):
        session_users = []
        cur.execute('select user_name, total_sessions from linkalator.user_access_totals')
        session_users = [dict(user_name = row[0], total_sessions = row[1]) for row in cur.fetchall()]        
        return session_users 


    def get_top_users(self, cur):
        top_users = []
        cur.execute('select user_name, total_sessions from linkalator.top_users')
        top_users = [dict(user_name = row[0], total_sessions = row[1]) for row in cur.fetchall()]        
        return top_users 


# Stored procedure utility methods
#-------------------------------------------------------------------------------------------------#
    
    def add_link(self, host_page_id, display_text, href, user_id):
        self.get_connection()
        cur = self.con.cursor()
        link_id = cur.var(cx_Oracle.STRING)
        h_page_id = int(host_page_id)
        u_id = int(user_id)
        cur.callproc('linkalator.add_link', (h_page_id, display_text, href, u_id, link_id))
        cur.close()
        self.con.close()
        return link_id.getvalue(0)


    def add_page(self, user_id, page_title):
        self.get_connection()
        cur = self.con.cursor()
        page_id = cur.var(cx_Oracle.STRING)
        cur.callproc('linkalator.create_page', (user_id, page_title, page_id))
        cur.close()
        self.con.close()
        return page_id.getvalue(0)


    def deactivate_link(self, link_id):
        self.get_connection()
        cur = self.con.cursor()
        cur.callproc('linkalator.deactivate_link', [link_id])
        cur.close()
        self.con.close()


    def deactivate_page(self, page_id):
        self.get_connection()
        cur = self.con.cursor()
        cur.callproc('linkalator.deactivate_page', [page_id])
        cur.close()
        self.con.close()


    def reactivate_page(self, page_id):
        self.get_connection()
        cur = self.con.cursor()
        cur.callproc('linkalator.reactivate_page', [page_id])
        cur.close()
        self.con.close()


    def increment_click_count(self, link_id):
        self.get_connection()
        cur = self.con.cursor()
        params = []
        params.append(int(link_id))        
        cur.callproc('linkalator.increment_click_count', params)
        cur.close()
        self.con.close()


    def validate_user(self, u_name, p_word):
        self.get_connection()
        cur = self.con.cursor()
        u_id = cur.callfunc('linkalator.login_user', cx_Oracle.NUMBER, (u_name, p_word))
        cur.close()
        self.con.close()
        return u_id


    def create_user(self, user_name, password):
        self.get_connection()
        cur = self.con.cursor()
        user_id = cur.var(cx_Oracle.STRING)
        cur.callproc('linkalator.create_user', (user_name, password, user_id))
        cur.close()
        self.con.close()
        return int(user_id.getvalue(0))


    def start_user_session(self, user_id, start_page_id):
        self.get_connection()
        cur = self.con.cursor()
        session_id = cur.var(cx_Oracle.STRING)
        u_id = int(user_id)
        sp_id = int(start_page_id)
        cur.callproc('linkalator.create_session', [u_id, sp_id, session_id])
        cur.close()
        self.con.close()
        return session_id.getvalue(0)
        

    def end_user_session(self):
        session_id = None
        end_page_id = None

        if session.get(Cfg.current_session_id):
            session_id = int(session[Cfg.current_session_id])
            session.pop(Cfg.current_session_id, None)

        if session.get(Cfg.requested_page_id):
            end_page_id = int(session[Cfg.requested_page_id])
            session.pop(Cfg.requested_page_id, None)
        else:
            end_page_id = self.get_lowest_page_id()

        if session.get(Cfg.current_user_id):
            session.pop(Cfg.current_user_id, None)

        if session_id and session.get(Cfg.logged_in):
            session.pop(Cfg.logged_in, None)
            self.get_connection()
            cur = self.con.cursor()
            cur.callproc('linkalator.end_session', (end_page_id, session_id))
            cur.close()
            self.con.close()


    def change_current_page(self, cur, destination_page_id, session_id):
        cur.callproc('linkalator.change_current_page_internal', (destination_page_id, session_id))        



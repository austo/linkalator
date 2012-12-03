import cx_Oracle
from cfg import Cfg

#NOTE: for new items, use JavaScript to insert a tolken value into the ID of the object in question,
#   then decide whether to insert or update by presence of tolken.
#   The only issue will be insertion of valid ID's into new objects, thus overwriting valid old ones

class DataLayer:
    def __init__(self, connection_string = 'default'):
        if connection_string == 'default':
            self.connection_string = Cfg().connection_string
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

    def get_links(self, host_page_id = 1):
        self.get_connection()
        cur = self.con.cursor()
        cur.prepare('select link_id, display_text, href from links where host_page_id = :id')
        cur.execute(None, {'id': int(host_page_id)})
        res = cur.fetchall()
        cur.close()
        self.con.close()
        return res

    def add_link(self, host_page_id, display_text, href):
        self.get_connection()
        cur = self.con.cursor()
        # o_num = cur.var(cx_Oracle.NUMBER)
        # o_varchar = cur.var(cx_Oracle.VARCHAR)
        hpid = int(host_page_id)
        cur.callproc('add_link', (hpid, display_text, href))
        cur.close()
        self.con.close()
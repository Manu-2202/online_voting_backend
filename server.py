import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voting.db')
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
if not os.path.exists(STATIC_DIR):
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'legacy_vanilla')

# ==========================================
# 1. DATABASE SETUP AND INITIALIZATION
# ==========================================

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Voters Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voters (
            aadhar_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            dob TEXT NOT NULL,
            fingerprint_hash TEXT NOT NULL,
            iris_hash TEXT NOT NULL,
            has_voted INTEGER DEFAULT 0,
            vote_timestamp TEXT,
            mla_constituency TEXT NOT NULL,
            mp_constituency TEXT NOT NULL
        )
    ''')

    # Create Nominations Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nominations (
            nomination_id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_aadhar_id TEXT NOT NULL,
            name_of_candidate TEXT NOT NULL,
            party_name TEXT NOT NULL,
            party_symbol TEXT NOT NULL,
            candidate_photo TEXT NOT NULL,
            fee_amount REAL NOT NULL,
            paid_date TEXT NOT NULL,
            transaction_number TEXT UNIQUE NOT NULL,
            mobile TEXT NOT NULL,
            email TEXT NOT NULL,
            communication_address TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING'
        )
    ''')

    # Create Booths Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS booths (
            booth_number TEXT PRIMARY KEY,
            location_name TEXT NOT NULL,
            mla_constituency_code TEXT NOT NULL,
            mp_constituency_code TEXT NOT NULL,
            camera_id TEXT UNIQUE NOT NULL,
            ip_address TEXT NOT NULL,
            agent_name TEXT NOT NULL
        )
    ''')

    # Create Polls Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booth_number TEXT NOT NULL,
            candidate_name TEXT NOT NULL,
            party_name TEXT NOT NULL,
            mla_constituency TEXT NOT NULL,
            vote_time TEXT NOT NULL
        )
    ''')

    # Create Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')

    # Seed Initial Data if table is empty
    cursor.execute("SELECT COUNT(*) FROM voters")
    if cursor.fetchone()[0] == 0:
        voters_seed = [
            ('123456789012', 'Rahul Sharma', 'Plot 45, Jubilee Hills, Hyderabad, AP-094', '1990-05-14', 'FP_RAHUL_9081', 'IRIS_RAHUL_4421', 0, None, 'AP-094', 'MP-05'),
            ('987654321098', 'Priya Patel', 'Flat 102, Gachibowli, Hyderabad, AP-094', '1995-11-22', 'FP_PRIYA_3321', 'IRIS_PRIYA_8812', 0, None, 'AP-094', 'MP-05'),
            ('111122223333', 'Amit Kumar', 'Ward 3, Nizamabad, AP-094', '1988-02-09', 'FP_AMIT_7751', 'IRIS_AMIT_1123', 1, '2026-08-29T10:15:30Z', 'AP-094', 'MP-05'),
            ('444455556666', 'Sarah D Souza', 'Secunderabad Cantonment, AP-094', '1992-08-30', 'FP_SARAH_0091', 'IRIS_SARAH_9941', 0, None, 'AP-094', 'MP-05'),
            ('777788889999', 'Rajesh Rao', 'Khammam Central, TS-012', '1985-04-17', 'FP_RAJESH_8123', 'IRIS_RAJESH_0098', 0, None, 'TS-012', 'MP-02')
        ]
        cursor.executemany("INSERT INTO voters VALUES (?,?,?,?,?,?,?,?,?,?)", voters_seed)

    cursor.execute("SELECT COUNT(*) FROM nominations")
    if cursor.fetchone()[0] == 0:
        nominations_seed = [
            (1, '222233334444', 'A. Ramu', 'BJP', '🪷', 'AR', 25000, '2026-08-10', 'TXN88921', '9988776655', 'ramu@bjp.org', 'Visakhapatnam AP', 'APPROVED'),
            (2, '555566667777', 'D. Suresh', 'CONGRESS-I', '✋', 'DS', 25000, '2026-08-12', 'TXN91882', '9848012345', 'suresh@congress.in', 'Vijayawada AP', 'APPROVED'),
            (3, '888899990000', 'M. Naresh', 'CPI', '🛠️', 'MN', 25000, '2026-08-14', 'TXN11209', '9440123456', 'naresh@cpi.org', 'Guntur AP', 'APPROVED'),
            (4, '999900001111', 'K. Rao', 'TDP', '🚲', 'KR', 25000, '2026-08-18', 'TXN50442', '9177283921', 'rao@tdp.org', 'Tirupati AP', 'PENDING')
        ]
        cursor.executemany("INSERT INTO nominations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", nominations_seed)

    cursor.execute("SELECT COUNT(*) FROM booths")
    if cursor.fetchone()[0] == 0:
        booths_seed = [
            ('BOOTH-01', 'Government High School, Room 1', 'AP-094', 'MP-05', 'CAM-0192', '192.168.10.4', 'Inspector Prasad'),
            ('BOOTH-02', 'Community Hall, Gachibowli', 'AP-094', 'MP-05', 'CAM-0881', '192.168.10.15', 'Sub-Inspector Nair'),
            ('BOOTH-03 (MPS)', 'Mobile Van 1 (Armed Escorted)', 'AP-094', 'MP-05', 'CAM-0552', '10.120.45.101', 'Commander Das')
        ]
        cursor.executemany("INSERT INTO booths VALUES (?,?,?,?,?,?,?)", booths_seed)

    cursor.execute("SELECT COUNT(*) FROM polls")
    if cursor.fetchone()[0] == 0:
        polls_seed = [
            (1, 'BOOTH-01', 'A. Ramu', 'BJP', 'AP-094', '2026-08-29T08:14:02Z'),
            (2, 'BOOTH-01', 'D. Suresh', 'CONGRESS-I', 'AP-094', '2026-08-29T08:25:40Z'),
            (3, 'BOOTH-02', 'A. Ramu', 'BJP', 'AP-094', '2026-08-29T08:33:11Z')
        ]
        cursor.executemany("INSERT INTO polls VALUES (?,?,?,?,?,?)", polls_seed)

    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO settings VALUES ('timezone', 'GMT+5:30')")
        cursor.execute("INSERT INTO settings VALUES ('start_time', '07:00')")
        cursor.execute("INSERT INTO settings VALUES ('end_time', '18:00')")
        cursor.execute("INSERT INTO settings VALUES ('status', 'ACTIVE')")

    conn.commit()
    conn.close()

# ==========================================
# 2. REST API ROUTES
# ==========================================

@app.route('/api/voters', methods=['GET'])
def get_voters():
    conn = get_db_connection()
    voters = conn.execute('SELECT * FROM voters').fetchall()
    conn.close()
    return jsonify([dict(row) for row in voters])

@app.route('/api/voters/auth', methods=['POST'])
def auth_voter():
    data = request.json
    aadhar_id = data.get('aadhar_id')
    
    conn = get_db_connection()
    voter = conn.execute('SELECT * FROM voters WHERE aadhar_id = ?', (aadhar_id,)).fetchone()
    
    if not voter:
        conn.close()
        return jsonify({'error': 'Voter not registered in Aadhar database.'}), 404
        
    voter_dict = dict(voter)
    if voter_dict['has_voted']:
        conn.close()
        return jsonify({'error': 'Voter has already cast ballot.', 'voter': voter_dict}), 400
        
    conn.close()
    return jsonify({'success': True, 'voter': voter_dict})

@app.route('/api/nominations', methods=['GET'])
def get_nominations():
    conn = get_db_connection()
    nominations = conn.execute('SELECT * FROM nominations').fetchall()
    conn.close()
    return jsonify([dict(row) for row in nominations])

@app.route('/api/nominations/audit', methods=['POST'])
def audit_nomination():
    data = request.json
    nom_id = data.get('nomination_id')
    status = data.get('status')
    
    conn = get_db_connection()
    conn.execute('UPDATE nominations SET status = ? WHERE nomination_id = ?', (status, nom_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/booths', methods=['GET', 'POST'])
def manage_booths():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        try:
            conn.execute('''
                INSERT INTO booths (booth_number, location_name, mla_constituency_code, mp_constituency_code, camera_id, ip_address, agent_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (data['booth_number'], data['location_name'], data['mla_constituency_code'], 'MP-05', data['camera_id'], data['ip_address'], 'Zonal Guard Assigned'))
            conn.commit()
        except sqlite3.IntegrityError as e:
            conn.close()
            return jsonify({'error': 'Booth Terminal ID or Camera ID already exists.'}), 400
            
    booths = conn.execute('SELECT * FROM booths').fetchall()
    conn.close()
    return jsonify([dict(row) for row in booths])

@app.route('/api/vote', methods=['POST'])
def record_vote():
    data = request.json
    aadhar_id = data.get('aadhar_id')
    candidate_name = data.get('candidate_name')
    party_name = data.get('party_name')
    mla_const = data.get('mla_constituency')
    booth = data.get('booth_number', 'BOOTH-01')
    vote_time = data.get('vote_time')
    
    conn = get_db_connection()
    # Check already voted
    voter = conn.execute('SELECT has_voted FROM voters WHERE aadhar_id = ?', (aadhar_id,)).fetchone()
    if voter and voter['has_voted']:
        conn.close()
        return jsonify({'error': 'Double voting block triggered.'}), 400
        
    # Insert Vote
    conn.execute('''
        INSERT INTO polls (booth_number, candidate_name, party_name, mla_constituency, vote_time)
        VALUES (?, ?, ?, ?, ?)
    ''', (booth, candidate_name, party_name, mla_const, vote_time))
    
    # Mark Voter as voted
    conn.execute('UPDATE voters SET has_voted = 1, vote_timestamp = ? WHERE aadhar_id = ?', (vote_time, aadhar_id))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/polls', methods=['GET'])
def get_polls():
    conn = get_db_connection()
    polls = conn.execute('SELECT * FROM polls').fetchall()
    conn.close()
    return jsonify([dict(row) for row in polls])

@app.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        for k, v in data.items():
            conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k, str(v)))
        conn.commit()
        
    settings = conn.execute('SELECT * FROM settings').fetchall()
    conn.close()
    return jsonify({row['key']: row['value'] for row in settings})

@app.route('/api/super/reset', methods=['POST'])
def reset_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    init_db()
    return jsonify({'success': True})

# ==========================================
# 3. STATIC FILES SERVER
# ==========================================

@app.route('/')
def index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(STATIC_DIR, path)

if __name__ == '__main__':
    init_db()
    print("Aadhar Electronic Voting backend running on http://localhost:8080")
    app.run(host='0.0.0.0', port=8080, debug=True)

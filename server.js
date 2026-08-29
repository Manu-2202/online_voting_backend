const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Voter, Nomination, Booth, Poll, Setting, ElectionType } = require('./models');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. DUAL-LAYER DATABASE CONTROLLER
// ==========================================
let dbConnected = false;

// Seed Data definition
const SEED_VOTERS = [
    { aadhar_id: '123456789012', name: 'Rahul Sharma', address: 'Plot 45, Jubilee Hills, Hyderabad, AP-094', dob: '1990-05-14', fingerprint_hash: 'FP_RAHUL_9081', iris_hash: 'IRIS_RAHUL_4421', has_voted: false, vote_timestamp: null, mla_constituency: 'AP-094', mp_constituency: 'MP-05' },
    { aadhar_id: '987654321098', name: 'Priya Patel', address: 'Flat 102, Gachibowli, Hyderabad, AP-094', dob: '1995-11-22', fingerprint_hash: 'FP_PRIYA_3321', iris_hash: 'IRIS_PRIYA_8812', has_voted: false, vote_timestamp: null, mla_constituency: 'AP-094', mp_constituency: 'MP-05' },
    { aadhar_id: '111122223333', name: 'Amit Kumar', address: 'Ward 3, Nizamabad, AP-094', dob: '1988-02-09', fingerprint_hash: 'FP_AMIT_7751', iris_hash: 'IRIS_AMIT_1123', has_voted: true, vote_timestamp: '2026-08-29T10:15:30Z', mla_constituency: 'AP-094', mp_constituency: 'MP-05' },
    { aadhar_id: '444455556666', name: 'Sarah D Souza', address: 'Secunderabad Cantonment, AP-094', dob: '1992-08-30', fingerprint_hash: 'FP_SARAH_0091', iris_hash: 'IRIS_SARAH_9941', has_voted: false, vote_timestamp: null, mla_constituency: 'AP-094', mp_constituency: 'MP-05' },
    { aadhar_id: '777788889999', name: 'Rajesh Rao', address: 'Khammam Central, TS-012', dob: '1985-04-17', fingerprint_hash: 'FP_RAJESH_8123', iris_hash: 'IRIS_RAJESH_0098', has_voted: false, mla_constituency: 'TS-012', mp_constituency: 'MP-02' }
];

const SEED_NOMINATIONS = [
    { nomination_id: 1, candidate_aadhar_id: '222233334444', name_of_candidate: 'A. Ramu', party_name: 'BJP', party_symbol: '🪷', candidate_photo: 'AR', fee_amount: 25000, paid_date: '2026-08-10', transaction_number: 'TXN88921', mobile: '9988776655', email: 'ramu@bjp.org', communication_address: 'Visakhapatnam AP', status: 'APPROVED', election_type: 'general' },
    { nomination_id: 2, candidate_aadhar_id: '555566667777', name_of_candidate: 'D. Suresh', party_name: 'CONGRESS-I', party_symbol: '✋', candidate_photo: 'DS', fee_amount: 25000, paid_date: '2026-08-12', transaction_number: 'TXN91882', mobile: '9848012345', email: 'suresh@congress.in', communication_address: 'Vijayawada AP', status: 'APPROVED', election_type: 'general' },
    { nomination_id: 3, candidate_aadhar_id: '888899990000', name_of_candidate: 'M. Naresh', party_name: 'CPI', party_symbol: '🛠️', candidate_photo: 'MN', fee_amount: 25000, paid_date: '2026-08-14', transaction_number: 'TXN11209', mobile: '9440123456', email: 'naresh@cpi.org', communication_address: 'Guntur AP', status: 'APPROVED', election_type: 'general' },
    { nomination_id: 4, candidate_aadhar_id: '999900001111', name_of_candidate: 'K. Rao', party_name: 'TDP', party_symbol: '🚲', candidate_photo: 'KR', fee_amount: 25000, paid_date: '2026-08-18', transaction_number: 'TXN50442', mobile: '9177283921', email: 'rao@tdp.org', communication_address: 'Tirupati AP', status: 'PENDING', election_type: 'general' }
];

const SEED_BOOTHS = [
    { booth_number: 'BOOTH-01', location_name: 'Government High School, Room 1', mla_constituency_code: 'AP-094', mp_constituency_code: 'MP-05', camera_id: 'CAM-0192', ip_address: '192.168.10.4', agent_name: 'Inspector Prasad', election_type: 'general' },
    { booth_number: 'BOOTH-02', location_name: 'Community Hall, Gachibowli', mla_constituency_code: 'AP-094', mp_constituency_code: 'MP-05', camera_id: 'CAM-0881', ip_address: '192.168.10.15', agent_name: 'Sub-Inspector Nair', election_type: 'general' },
    { booth_number: 'BOOTH-03 (MPS)', location_name: 'Mobile Van 1 (Armed Escorted)', mla_constituency_code: 'AP-094', mp_constituency_code: 'MP-05', camera_id: 'CAM-0552', ip_address: '10.120.45.101', agent_name: 'Commander Das', election_type: 'general' }
];

const SEED_POLLS = [
    { booth_number: 'BOOTH-01', candidate_name: 'A. Ramu', party_name: 'BJP', mla_constituency: 'AP-094', vote_time: '2026-08-29T08:14:02Z', election_type: 'general' },
    { booth_number: 'BOOTH-01', candidate_name: 'D. Suresh', party_name: 'CONGRESS-I', mla_constituency: 'AP-094', vote_time: '2026-08-29T08:25:40Z', election_type: 'general' },
    { booth_number: 'BOOTH-02', candidate_name: 'A. Ramu', party_name: 'BJP', mla_constituency: 'AP-094', vote_time: '2026-08-29T08:33:11Z', election_type: 'general' }
];

const SEED_SETTINGS = {
    timezone: 'GMT+5:30',
    start_time: '07:00',
    end_time: '18:00',
    status: 'ACTIVE'
};

const SEED_ELECTION_TYPES = [
    { id: 'general', name: 'General Assembly Elections', desc: 'National/State democratic legislative voting.' },
    { id: 'banking', name: 'Banking Board Elections', desc: 'Board of directors election for cooperative banks.' },
    { id: 'college', name: 'College Union Elections', desc: 'Student council representative elections.' }
];

// Memory fallback store
let memoryStore = {
    voters: JSON.parse(JSON.stringify(SEED_VOTERS)),
    nominations: JSON.parse(JSON.stringify(SEED_NOMINATIONS)),
    booths: JSON.parse(JSON.stringify(SEED_BOOTHS)),
    polls: JSON.parse(JSON.stringify(SEED_POLLS)),
    settings: JSON.parse(JSON.stringify(SEED_SETTINGS)),
    electionTypes: JSON.parse(JSON.stringify(SEED_ELECTION_TYPES))
};

// Database seeding logic
async function seedDatabase() {
    try {
        const voterCount = await Voter.countDocuments();
        if (voterCount === 0) {
            await Voter.insertMany(SEED_VOTERS);
        }
        
        const nomCount = await Nomination.countDocuments();
        if (nomCount === 0) {
            await Nomination.insertMany(SEED_NOMINATIONS);
        }
        
        const boothCount = await Booth.countDocuments();
        if (boothCount === 0) {
            await Booth.insertMany(SEED_BOOTHS);
        }
        
        const pollCount = await Poll.countDocuments();
        if (pollCount === 0) {
            await Poll.insertMany(SEED_POLLS);
        }
        
        const settingsCount = await Setting.countDocuments();
        if (settingsCount === 0) {
            const settingsSeed = Object.entries(SEED_SETTINGS).map(([k, v]) => ({ key: k, value: v }));
            await Setting.insertMany(settingsSeed);
        }

        const electionTypesCount = await ElectionType.countDocuments();
        if (electionTypesCount === 0) {
            await ElectionType.insertMany(SEED_ELECTION_TYPES);
        }
        console.log('MongoDB Seed completed successfully.');
    } catch (e) {
        console.error('Seeding MongoDB failed:', e);
    }
}

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_voting_system';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    .then(async () => {
        dbConnected = true;
        console.log('MongoDB Connected successfully.');
        await seedDatabase();
    })
    .catch(err => {
        dbConnected = false;
        console.warn('MongoDB offline or connection failed. Backend running in Memory Sandbox mode.');
    });

// ==========================================
// 2. REST API CONTROLLERS
// ==========================================

// GET Voters list
app.get('/api/voters', async (req, res) => {
    if (dbConnected) {
        try {
            const data = await Voter.find();
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ error: 'DB Read Error' });
        }
    } else {
        return res.json(memoryStore.voters);
    }
});

// POST Voter Auth
app.post('/api/voters/auth', async (req, res) => {
    const { aadhar_id } = req.body;
    if (dbConnected) {
        try {
            const voter = await Voter.findOne({ aadhar_id });
            if (!voter) return res.status(404).json({ error: 'Voter not found in central registry.' });
            if (voter.has_voted) return res.status(400).json({ error: 'Double vote detected. Aadhar already voted.', voter });
            return res.json({ success: true, voter });
        } catch (e) {
            return res.status(500).json({ error: 'DB Query Error' });
        }
    } else {
        const voter = memoryStore.voters.find(v => v.aadhar_id === aadhar_id);
        if (!voter) return res.status(404).json({ error: 'Voter not found in central registry.' });
        if (voter.has_voted) return res.status(400).json({ error: 'Double vote detected. Aadhar already voted.', voter });
        return res.json({ success: true, voter });
    }
});

// GET Nominations
app.get('/api/nominations', async (req, res) => {
    if (dbConnected) {
        try {
            const data = await Nomination.find();
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ error: 'DB Read Error' });
        }
    } else {
        return res.json(memoryStore.nominations);
    }
});

// POST Create Nomination
app.post('/api/nominations', async (req, res) => {
    const { candidate_aadhar_id, name_of_candidate, party_name, party_symbol, candidate_photo, fee_amount, paid_date, transaction_number, mobile, email, communication_address } = req.body;

    if (dbConnected) {
        try {
            // Check if Aadhaar already exists
            const existing = await Nomination.findOne({ candidate_aadhar_id });
            if (existing) {
                return res.status(400).json({ error: 'Nomination already filed for this Aadhaar ID.' });
            }

            const maxNom = await Nomination.findOne().sort({ nomination_id: -1 });
            const nextId = maxNom ? maxNom.nomination_id + 1 : 1;

            const newNom = new Nomination({
                nomination_id: nextId,
                candidate_aadhar_id,
                name_of_candidate,
                party_name,
                party_symbol,
                candidate_photo: candidate_photo || '👤',
                fee_amount: fee_amount || 25000,
                paid_date: paid_date || new Date().toISOString().split('T')[0],
                transaction_number,
                mobile,
                email,
                communication_address,
                status: 'APPROVED'
            });

            await newNom.save();
            return res.json({ success: true, nomination: newNom });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to save nomination on database.' });
        }
    } else {
        const existing = memoryStore.nominations.find(n => n.candidate_aadhar_id === candidate_aadhar_id);
        if (existing) {
            return res.status(400).json({ error: 'Nomination already filed for this Aadhaar ID.' });
        }

        const maxNom = memoryStore.nominations.reduce((max, n) => n.nomination_id > max ? n.nomination_id : max, 0);
        const nextId = maxNom + 1;

        const newNom = {
            nomination_id: nextId,
            candidate_aadhar_id,
            name_of_candidate,
            party_name,
            party_symbol,
            candidate_photo: candidate_photo || '👤',
            fee_amount: fee_amount || 25000,
            paid_date: paid_date || new Date().toISOString().split('T')[0],
            transaction_number,
            mobile,
            email,
            communication_address,
            status: 'APPROVED'
        };

        memoryStore.nominations.push(newNom);
        return res.json({ success: true, nomination: newNom });
    }
});

// POST Audit Nomination
app.post('/api/nominations/audit', async (req, res) => {
    const { nomination_id, status } = req.body;
    if (dbConnected) {
        try {
            await Nomination.updateOne({ nomination_id }, { status });
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'DB Update Error' });
        }
    } else {
        memoryStore.nominations = memoryStore.nominations.map(n => {
            if (n.nomination_id === nomination_id) {
                return { ...n, status };
            }
            return n;
        });
        return res.json({ success: true });
    }
});

// GET/POST Booths
app.get('/api/booths', async (req, res) => {
    if (dbConnected) {
        const data = await Booth.find();
        return res.json(data);
    } else {
        return res.json(memoryStore.booths);
    }
});

app.post('/api/booths', async (req, res) => {
    const data = req.body;
    const type = data.election_type || 'general';
    if (dbConnected) {
        try {
            const newBooth = new Booth({
                booth_number: data.booth_number,
                location_name: data.location_name,
                mla_constituency_code: data.mla_constituency_code,
                mp_constituency_code: 'MP-05',
                camera_id: data.camera_id,
                ip_address: data.ip_address,
                agent_name: 'Zonal Guard Assigned',
                election_type: type
            });
            await newBooth.save();
            return res.json({ success: true });
        } catch (e) {
            return res.status(400).json({ error: 'Terminal ID or Camera ID already exists.' });
        }
    } else {
        const exists = memoryStore.booths.some(b => b.booth_number === data.booth_number || b.camera_id === data.camera_id);
        if (exists) {
            return res.status(400).json({ error: 'Terminal ID or Camera ID already exists.' });
        }
        memoryStore.booths.push({
            booth_number: data.booth_number,
            location_name: data.location_name,
            mla_constituency_code: data.mla_constituency_code,
            mp_constituency_code: 'MP-05',
            camera_id: data.camera_id,
            ip_address: data.ip_address,
            agent_name: 'Zonal Guard Assigned',
            election_type: type
        });
        return res.json({ success: true });
    }
});

// POST Vote ballot
app.post('/api/vote', async (req, res) => {
    const { aadhar_id, candidate_name, party_name, mla_constituency, vote_time, booth_number, election_type } = req.body;
    const booth = booth_number || 'BOOTH-01';
    const type = election_type || 'general';

    if (dbConnected) {
        try {
            const voter = await Voter.findOne({ aadhar_id });
            if (voter && voter.has_voted) {
                return res.status(400).json({ error: 'Double vote detected. Tally rejected.' });
            }

            const newPoll = new Poll({ booth_number: booth, candidate_name, party_name, mla_constituency, vote_time, election_type: type });
            await newPoll.save();

            await Voter.updateOne({ aadhar_id }, { has_voted: true, vote_timestamp: vote_time });
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Vote transaction writing failed.' });
        }
    } else {
        const voter = memoryStore.voters.find(v => v.aadhar_id === aadhar_id);
        if (voter && voter.has_voted) {
            return res.status(400).json({ error: 'Double vote detected. Tally rejected.' });
        }

        memoryStore.polls.push({ booth_number: booth, candidate_name, party_name, mla_constituency, vote_time, election_type: type });
        memoryStore.voters = memoryStore.voters.map(v => {
            if (v.aadhar_id === aadhar_id) {
                return { ...v, has_voted: true, vote_timestamp: vote_time };
            }
            return v;
        });
        return res.json({ success: true });
    }
});

// GET Polls Logs
app.get('/api/polls', async (req, res) => {
    if (dbConnected) {
        const data = await Poll.find();
        return res.json(data);
    } else {
        return res.json(memoryStore.polls);
    }
});

// GET/POST Settings
app.get('/api/settings', async (req, res) => {
    if (dbConnected) {
        try {
            const list = await Setting.find();
            const config = {};
            list.forEach(item => {
                config[item.key] = item.value;
            });
            return res.json(config);
        } catch (e) {
            return res.json(SEED_SETTINGS);
        }
    } else {
        return res.json(memoryStore.settings);
    }
});

app.post('/api/settings', async (req, res) => {
    const data = req.body;
    if (dbConnected) {
        try {
            for (const [k, v] of Object.entries(data)) {
                await Setting.updateOne({ key: k }, { value: String(v) }, { upsert: true });
            }
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to update settings.' });
        }
    } else {
        for (const [k, v] of Object.entries(data)) {
            memoryStore.settings[k] = String(v);
        }
        return res.json({ success: true });
    }
});

// POST Reset Database
app.post('/api/super/reset', async (req, res) => {
    if (dbConnected) {
        try {
            await Voter.deleteMany({});
            await Nomination.deleteMany({});
            await Booth.deleteMany({});
            await Poll.deleteMany({});
            await Setting.deleteMany({});
            await seedDatabase();
            return res.json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to reset MongoDB.' });
        }
    } else {
        memoryStore.voters = JSON.parse(JSON.stringify(SEED_VOTERS));
        memoryStore.nominations = JSON.parse(JSON.stringify(SEED_NOMINATIONS));
        memoryStore.booths = JSON.parse(JSON.stringify(SEED_BOOTHS));
        memoryStore.polls = JSON.parse(JSON.stringify(SEED_POLLS));
        memoryStore.settings = JSON.parse(JSON.stringify(SEED_SETTINGS));
        return res.json({ success: true });
    }
});

// POST Simulate 25 Votes
app.post('/api/super/simulate', async (req, res) => {
    const { election_type } = req.body;
    const type = election_type || 'general';
    try {
        const timestamp = new Date().toISOString();
        if (dbConnected) {
            const unvoted = await Voter.find({ has_voted: false });
            if (unvoted.length === 0) {
                return res.json({ success: true, count: 0, msg: "All registered voters have already cast ballots." });
            }

            const approved = await Nomination.find({ status: 'APPROVED', election_type: type });
            const candidates = approved.map(c => ({ name: c.name_of_candidate, party: c.party_name }));
            candidates.push({ name: 'NOTA', party: 'NOTA' });

            const countToSimulate = Math.min(25, unvoted.length);
            const votesToInsert = [];
            const voterIdsToUpdate = [];

            for (let i = 0; i < countToSimulate; i++) {
                const voter = unvoted[i];
                const choice = candidates[Math.floor(Math.random() * candidates.length)];
                
                votesToInsert.push({
                    booth_number: 'BOOTH-01',
                    candidate_name: choice.name,
                    party_name: choice.party,
                    mla_constituency: voter.mla_constituency,
                    vote_time: timestamp,
                    election_type: type
                });
                
                voterIdsToUpdate.push(voter.aadhar_id);
            }

            await Poll.insertMany(votesToInsert);
            await Voter.updateMany({ aadhar_id: { $in: voterIdsToUpdate } }, { has_voted: true, vote_timestamp: timestamp });
            
            return res.json({ success: true, count: countToSimulate });
        } else {
            const unvoted = memoryStore.voters.filter(v => !v.has_voted);
            if (unvoted.length === 0) {
                return res.json({ success: true, count: 0 });
            }

            const approved = memoryStore.nominations.filter(n => n.status === 'APPROVED' && (n.election_type || 'general') === type);
            const candidates = approved.map(c => ({ name: c.name_of_candidate, party: c.party_name }));
            candidates.push({ name: 'NOTA', party: 'NOTA' });

            const countToSimulate = Math.min(25, unvoted.length);
            for (let i = 0; i < countToSimulate; i++) {
                const voter = unvoted[i];
                const choice = candidates[Math.floor(Math.random() * candidates.length)];
                
                memoryStore.polls.push({
                    booth_number: 'BOOTH-01',
                    candidate_name: choice.name,
                    party_name: choice.party,
                    mla_constituency: voter.mla_constituency,
                    vote_time: timestamp,
                    election_type: type
                });

                voter.has_voted = true;
                voter.vote_timestamp = timestamp;
            }

            return res.json({ success: true, count: countToSimulate });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to simulate voting.' });
    }
});

// GET Election Types
app.get('/api/election-types', async (req, res) => {
    if (dbConnected) {
        try {
            const data = await ElectionType.find();
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ error: 'DB Read Error' });
        }
    } else {
        return res.json(memoryStore.electionTypes);
    }
});

// POST Create Election Type
app.post('/api/election-types', async (req, res) => {
    const { id, name, desc, subTypes } = req.body;
    if (!id || !name || !desc) {
        return res.status(400).json({ error: 'All fields (id, name, desc) are required.' });
    }

    const sanitizedSubTypes = Array.isArray(subTypes) ? subTypes.filter(s => s.id && s.name) : [];

    if (dbConnected) {
        try {
            const existing = await ElectionType.findOne({ id });
            if (existing) {
                return res.status(400).json({ error: 'Election type already exists.' });
            }

            const newType = new ElectionType({ id, name, desc, subTypes: sanitizedSubTypes });
            await newType.save();
            return res.json({ success: true, electionType: newType });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to save election type.' });
        }
    } else {
        const existing = memoryStore.electionTypes.find(t => t.id === id);
        if (existing) {
            return res.status(400).json({ error: 'Election type already exists.' });
        }

        const newType = { id, name, desc, subTypes: sanitizedSubTypes };
        memoryStore.electionTypes.push(newType);
        return res.json({ success: true, electionType: newType });
    }
});

// POST Add Sub-Type to existing Election Type
app.post('/api/election-types/:id/subtypes', async (req, res) => {
    const { id } = req.params;
    const { subId, subName } = req.body;
    if (!subId || !subName) {
        return res.status(400).json({ error: 'subId and subName are required.' });
    }

    if (dbConnected) {
        try {
            const elType = await ElectionType.findOne({ id });
            if (!elType) return res.status(404).json({ error: 'Election type not found.' });
            if (elType.subTypes.some(s => s.id === subId)) {
                return res.status(400).json({ error: 'Sub-type ID already exists for this election type.' });
            }
            elType.subTypes.push({ id: subId, name: subName });
            await elType.save();
            return res.json({ success: true, electionType: elType });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to add sub-type.' });
        }
    } else {
        const elType = memoryStore.electionTypes.find(t => t.id === id);
        if (!elType) return res.status(404).json({ error: 'Election type not found.' });
        if (!elType.subTypes) elType.subTypes = [];
        if (elType.subTypes.some(s => s.id === subId)) {
            return res.status(400).json({ error: 'Sub-type ID already exists for this election type.' });
        }
        elType.subTypes.push({ id: subId, name: subName });
        return res.json({ success: true, electionType: elType });
    }
});

// ==========================================
// 3. FRONTEND PRODUCTION BUNDLE STATIC FILES
// ==========================================

const staticPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`MERN Backend server running on port ${PORT}`);
});

const mongoose = require('mongoose');

// 1. Voter Schema
const VoterSchema = new mongoose.Schema({
    aadhar_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    dob: { type: String, required: true },
    fingerprint_hash: { type: String, required: true },
    iris_hash: { type: String, required: true },
    has_voted: { type: Boolean, default: false },
    vote_timestamp: { type: String, default: null },
    mla_constituency: { type: String, required: true },
    mp_constituency: { type: String, required: true }
});

// 2. Candidate Nominations Schema
const NominationSchema = new mongoose.Schema({
    nomination_id: { type: Number, required: true, unique: true },
    candidate_aadhar_id: { type: String, required: true },
    name_of_candidate: { type: String, required: true },
    party_name: { type: String, required: true },
    party_symbol: { type: String, required: true },
    candidate_photo: { type: String, required: true },
    fee_amount: { type: Number, required: true },
    paid_date: { type: String, required: true },
    transaction_number: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    communication_address: { type: String, required: true },
    status: { type: String, default: 'PENDING' }, // PENDING, APPROVED, REJECTED, WITHDRAWN
    election_type: { type: String, default: 'general' }
});

// 3. Polling Booth Configuration Schema
const BoothSchema = new mongoose.Schema({
    booth_number: { type: String, required: true, unique: true },
    location_name: { type: String, required: true },
    mla_constituency_code: { type: String, required: true },
    mp_constituency_code: { type: String, required: true },
    camera_id: { type: String, required: true, unique: true },
    ip_address: { type: String, required: true },
    agent_name: { type: String, required: true },
    election_type: { type: String, default: 'general' }
});

// 4. Poll Tally Schema
const PollSchema = new mongoose.Schema({
    booth_number: { type: String, required: true },
    candidate_name: { type: String, required: true },
    party_name: { type: String, required: true },
    mla_constituency: { type: String, required: true },
    vote_time: { type: String, required: true },
    election_type: { type: String, default: 'general' }
});

// 5. Global Settings Schema
const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});

// 6. Election Types Schema
const ElectionTypeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    desc: { type: String, required: true },
    subTypes: [{
        id: { type: String, required: true },
        name: { type: String, required: true }
    }]
});

module.exports = {
    Voter: mongoose.model('Voter', VoterSchema),
    Nomination: mongoose.model('Nomination', NominationSchema),
    Booth: mongoose.model('Booth', BoothSchema),
    Poll: mongoose.model('Poll', PollSchema),
    Setting: mongoose.model('Setting', SettingSchema),
    ElectionType: mongoose.model('ElectionType', ElectionTypeSchema)
};

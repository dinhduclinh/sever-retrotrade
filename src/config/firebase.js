const admin = require('firebase-admin');

function getServiceAccountFromEnv() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
        }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        // Support multiline keys stored with \n
        privateKey = privateKey.replace(/\\n/g, '\n');
        return {
            project_id: projectId,
            client_email: clientEmail,
            private_key: privateKey
        };
    }

    return null;
}

let initialized = false;

function getAdmin() {
    if (!initialized) {
        const serviceAccount = getServiceAccountFromEnv();
        if (!serviceAccount) {
            throw new Error('Firebase Admin credentials not found in environment variables');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        initialized = true;
    }
    return admin;
}

module.exports = { getAdmin };



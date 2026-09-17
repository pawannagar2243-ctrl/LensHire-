const mongoose = require('mongoose');

/**
 * Log URI without exposing username/password.
 */
const sanitizeUriForLog = (uri) => {
  if (!uri) return '(not set)';
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
};

/**
 * Map MongoDB/Mongoose errors to actionable developer hints.
 * Original error.message is always logged separately.
 */
const getConnectionHints = (error, uri) => {
  const msg = error.message || '';
  const code = error.code || error.cause?.code || '';

  if (!uri || !String(uri).trim()) {
    return [
      'MONGODB_URI is missing or empty in backend/.env',
      'Add MONGODB_URI (not MONGO_URI) with your Atlas connection string',
      'Atlas → Database → Connect → Drivers → Node.js → copy the full URI',
    ];
  }

  if (/YOUR-CLUSTER|YOUR_CLUSTER|ACTUAL_CLUSTER|USERNAME|PASSWORD|127\.0\.0\.1:27017/i.test(uri)) {
    return [
      'MONGODB_URI still contains a placeholder value',
      'Replace USERNAME, PASSWORD, and ACTUAL_CLUSTER with values from MongoDB Atlas',
      'Do not guess the cluster hostname — copy it exactly from the Atlas Connect dialog',
    ];
  }

  if (
    code === 'ENOTFOUND' ||
    /querySrv ENOTFOUND|getaddrinfo ENOTFOUND|ECONNREFUSED/i.test(msg)
  ) {
    const srvHost = msg.match(/_mongodb\._tcp\.([^\s'"]+)/)?.[1];
    const uriHost = uri.match(/@([^/?]+)/)?.[1];
    const host = srvHost || uriHost || 'unknown';
    return [
      `DNS/network could not reach MongoDB host: ${host}`,
      'The cluster hostname is likely wrong, deleted, renamed, or unreachable',
      'In Atlas: Database → Connect → Drivers → copy the mongodb+srv:// URI exactly',
      'Do not use invented hostnames such as pawan.9rshyow.mongodb.net unless Atlas shows that exact host',
      'Check VPN, firewall, and internet DNS if the hostname is correct in Atlas',
    ];
  }

  if (/authentication failed|bad auth|Invalid credentials|SCRAM-SHA/i.test(msg)) {
    return [
      'MongoDB authentication failed — invalid username or password',
      'Verify the database user in Atlas → Database Access',
      'If the password contains special characters (@ # % / : ? &), URL-encode them in the URI',
      'Example: password "p@ss" becomes "p%40ss" in the connection string',
    ];
  }

  if (/not authorized|auth source|AuthenticationFailed/i.test(msg)) {
    return [
      'MongoDB user exists but lacks permission for this database',
      'Ensure the user has read/write access to the target database in Atlas',
    ];
  }

  if (/IP.*not allowed|whitelist|NetworkAccess|ServerSelectionTimedOut/i.test(msg)) {
    return [
      'MongoDB Atlas may be blocking this machine\'s IP address',
      'Atlas → Network Access → Add IP Address → add your current IP (or 0.0.0.0/0 for local dev only)',
    ];
  }

  if (/timed out|timeout|serverSelectionTimeoutMS|ETIMEDOUT/i.test(msg)) {
    return [
      'Connection to MongoDB Atlas timed out',
      'Check cluster status in Atlas, your network, firewall, and VPN settings',
    ];
  }

  if (/invalid URI|Malformed/i.test(msg)) {
    return [
      'MONGODB_URI format is invalid',
      'Expected: mongodb+srv://twndkr22_db_user:<db_password>@pawan.9rshyow.mongodb.net/?appName=pawan',
      'URL-encode special characters in the password portion of the URI',
    ];
  }

  return ['Review the original error above and verify Atlas cluster, user, IP access, and URI format'];
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (!uri?.trim()) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables"
      );
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    if (conn.connection.readyState !== 1) {
      throw new Error("MongoDB connection not ready after connect");
    }

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error(
      `MONGODB_URI (sanitized): ${sanitizeUriForLog(uri)}`
    );

    getConnectionHints(error, uri).forEach((hint) =>
      console.error(`  • ${hint}`)
    );

    process.exit(1);
  }
};

module.exports = connectDB;

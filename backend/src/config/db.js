import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js on Windows when c-ares DNS resolver defaults to [ '127.0.0.1' ] causing querySrv ECONNREFUSED
if (dns.getServers().includes('127.0.0.1')) {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch (err) {
    // Graceful fallback
  }
}

export const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI && isProduction) {
      throw new Error('MONGODB_URI environment variable is required in production.');
    }

    const uriToConnect = mongoURI || 'mongodb://127.0.0.1:27017/pottery_rugs';
    const conn = await mongoose.connect(uriToConnect, {
      autoIndex: !isProduction,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

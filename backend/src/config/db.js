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
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pottery_rugs';
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

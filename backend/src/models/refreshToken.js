import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 }, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), },
        revokedAt: { type: Date, default: null },
    },
    { 
        timestamps: true,
        collection: 'RefreshTokens' 
    }
);

export default mongoose.model('RefreshToken', refreshTokenSchema);

import { Schema, model } from "mongoose"

/**
 * Profile Schema
 */

const ProfileSchema = new Schema({
    address: { type: String, default: '' },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },
});

model('Profile', ProfileSchema);

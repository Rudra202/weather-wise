import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    country: { type: String, required: true, trim: true, maxlength: 120 },
    admin1: { type: String, trim: true, maxlength: 120, default: null },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2, default: null },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    timezone: { type: String, trim: true, maxlength: 80, default: null },
    /** Rounded coordinates give a stable identity for duplicate detection. */
    locationKey: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        delete ret.locationKey;
        return ret;
      },
    },
  },
);

favoriteSchema.index({ userId: 1, locationKey: 1 }, { unique: true });

export type FavoriteDocument = InferSchemaType<typeof favoriteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Favorite = mongoose.model('Favorite', favoriteSchema);

export function buildLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

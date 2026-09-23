const mongoose = require('mongoose');

const VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    serviceCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
        index: true,
      },
    ],
    serviceAreas: [
      {
        city: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        radiusMiles: { type: Number, default: 25 },
      },
    ],
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
    },
    documents: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        documentType: { type: String, default: 'LICENSE' }, // LICENSE, INSURANCE, ID, CERTIFICATION
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING',
      index: true,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    hourlyRate: {
      type: Number,
      default: 65,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancellationRate: {
      type: Number,
      default: 0, // percentage 0-100
      min: 0,
      max: 100,
    },
    availabilityNotes: {
      type: String,
      default: 'Mon-Sat: 8am - 6pm',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for matching engine queries
providerProfileSchema.index({ verificationStatus: 1, serviceCategories: 1, rating: -1 });

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);

module.exports = {
  ProviderProfile,
  VERIFICATION_STATUSES,
};

import mongoose, { Schema, Document } from 'mongoose';

export type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';

export interface ISplit {
  memberId: mongoose.Types.ObjectId;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface IItem {
  name: string;
  amount: number;
  memberIds: mongoose.Types.ObjectId[];
}

export interface IExpense extends Document {
  groupId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  categoryId?: mongoose.Types.ObjectId;
  paidById: mongoose.Types.ObjectId;
  splitMethod: SplitMethod;
  splits: ISplit[];
  items?: IItem[];
  createdAt: Date;
  updatedAt: Date;
}

const SplitSchema = new Schema<ISplit>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    shares: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const ItemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    memberIds: [{
      type: Schema.Types.ObjectId,
      required: true,
    }],
  },
  { _id: true }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
    },
    paidById: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    splitMethod: {
      type: String,
      required: true,
      enum: ['equal', 'percentage', 'shares', 'exact', 'itemized'],
      default: 'equal',
    },
    splits: {
      type: [SplitSchema],
      required: true,
      validate: {
        validator: function(splits: ISplit[]) {
          return splits.length > 0;
        },
        message: 'At least one split is required',
      },
    },
    items: [ItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ExpenseSchema.index({ groupId: 1, date: -1 });
ExpenseSchema.index({ groupId: 1, paidById: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

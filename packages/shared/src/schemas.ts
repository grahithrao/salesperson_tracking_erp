import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, VISIT_OUTCOMES } from './constants';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Employee code, phone, or email is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  deviceId: z.string().optional(),
});

export const locationPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  networkType: z.string().nullable().optional(),
  deviceId: z.string().nullable().optional(),
  timestamp: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
});

export const locationUpdateSchema = z.object({
  sessionId: z.string().uuid().optional(),
  points: z.array(locationPointSchema).min(1, 'At least one coordinate point is required'),
});

export const startAttendanceSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deviceId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const endAttendanceSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const clientCreateSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  businessName: z.string().optional(),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(3, 'Pincode is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: z.string().default('Retailer'),
  creditLimit: z.number().nonnegative().default(50000),
  paymentTerms: z.string().default('Net 30'),
  notes: z.string().optional(),
  openingBalance: z.number().default(0),
  assignedSalespersonId: z.string().uuid().optional(),
});

export const startVisitSchema = z.object({
  clientId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isException: z.boolean().optional(),
  exceptionReason: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const endVisitSchema = z.object({
  outcome: z.nativeEnum(VISIT_OUTCOMES),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  voiceNoteUrl: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  discount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  idempotencyKey: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUSES),
  notes: z.string().optional(),
  rejectedReason: z.string().optional(),
});

export const createPaymentSchema = z.object({
  clientId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.nativeEnum(PAYMENT_METHODS),
  transactionReference: z.string().optional(),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
  collectedAt: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  idempotencyKey: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional(),
});

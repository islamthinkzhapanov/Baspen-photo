// PaymentProvider abstraction -- supports Kaspi Pay, Stripe, and manual payments.
// Concrete implementations will be added as payment integrations are finalized.

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  externalId: string;
  redirectUrl?: string;
  status: "pending" | "succeeded" | "failed";
  providerData?: Record<string, unknown>;
}

export interface RefundParams {
  externalId: string;
  amount?: number;
}

export interface PaymentProvider {
  name: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  verifyPayment(externalId: string): Promise<PaymentResult>;
  refund(params: RefundParams): Promise<{ success: boolean }>;
  parseWebhook(body: unknown, headers: Record<string, string>): Promise<{
    externalId: string;
    status: "succeeded" | "failed" | "refunded";
    rawData: Record<string, unknown>;
  } | null>;
}

// Manual payment (for testing / organizer-managed payments)
export class ManualPaymentProvider implements PaymentProvider {
  name = "manual";

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    return {
      externalId: `manual_${params.orderId}_${Date.now()}`,
      status: "succeeded",
    };
  }

  async verifyPayment(externalId: string): Promise<PaymentResult> {
    return { externalId, status: "succeeded" };
  }

  async refund(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async parseWebhook() {
    return null;
  }
}

// Kaspi Pay stub -- fill in with real API when integration is ready
export class KaspiPayProvider implements PaymentProvider {
  name = "kaspi";
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.KASPI_API_URL || "https://kaspi.kz/pay/api";
    this.apiKey = process.env.KASPI_API_KEY || "";
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // TODO: Implement real Kaspi Pay API call
    // POST /api/payment/create with amount, currency, returnUrl, etc.
    return {
      externalId: `kaspi_${params.orderId}_${Date.now()}`,
      redirectUrl: `${this.apiUrl}/checkout?order=${params.orderId}`,
      status: "pending",
      providerData: { apiKey: this.apiKey ? "configured" : "missing" },
    };
  }

  async verifyPayment(externalId: string): Promise<PaymentResult> {
    // TODO: GET /api/payment/status?id=externalId
    return { externalId, status: "pending" };
  }

  async refund(): Promise<{ success: boolean }> {
    // TODO: POST /api/payment/refund
    return { success: false };
  }

  async parseWebhook(
    body: unknown,
  ) {
    // TODO: Verify signature and extract payment status
    const data = body as Record<string, unknown>;
    if (!data?.paymentId) return null;
    return {
      externalId: String(data.paymentId),
      status: "succeeded" as const,
      rawData: data,
    };
  }
}

// Stripe stub -- fill in with real Stripe SDK when needed
export class StripePaymentProvider implements PaymentProvider {
  name = "stripe";

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // TODO: Use Stripe SDK to create checkout session
    return {
      externalId: `stripe_${params.orderId}_${Date.now()}`,
      redirectUrl: `https://checkout.stripe.com/stub`,
      status: "pending",
    };
  }

  async verifyPayment(externalId: string): Promise<PaymentResult> {
    return { externalId, status: "pending" };
  }

  async refund(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async parseWebhook() {
    return null;
  }
}

// Factory
const providers: Record<string, PaymentProvider> = {
  manual: new ManualPaymentProvider(),
  kaspi: new KaspiPayProvider(),
  stripe: new StripePaymentProvider(),
};

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown payment provider: ${name}`);
  return provider;
}

export function getDefaultProvider(): PaymentProvider {
  const defaultName = process.env.PAYMENT_PROVIDER || "manual";
  return getPaymentProvider(defaultName);
}

// Pricing helpers
export function calculatePhotoPrice(event: {
  pricingMode: string;
  settings?: {
    pricePerPhoto?: number;
    packageDiscount?: number;
    commissionPercent?: number;
  } | null;
}): { pricePerPhoto: number; packageDiscount: number; commissionPercent: number } {
  const pricePerPhoto = event.settings?.pricePerPhoto ?? 500; // 500 KZT default
  const packageDiscount = event.settings?.packageDiscount ?? 30; // 30% default
  const commissionPercent =
    event.pricingMode === "exclusive"
      ? 0
      : (event.settings?.commissionPercent ?? 20); // 20% platform commission default

  return { pricePerPhoto, packageDiscount, commissionPercent };
}

export function calculateOrderTotal(
  pricePerPhoto: number,
  photoCount: number,
  isPackage: boolean,
  packageDiscount: number
): number {
  const subtotal = pricePerPhoto * photoCount;
  if (isPackage && photoCount > 1) {
    return Math.round(subtotal * (1 - packageDiscount / 100));
  }
  return subtotal;
}

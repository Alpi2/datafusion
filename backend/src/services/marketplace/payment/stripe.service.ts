import Stripe from "stripe";
import { logger } from "../../../shared/utils/logger";

export class StripeService {
  private stripe: Stripe;
  constructor() {
    // Accept newer apiVersion strings by casting to any to satisfy TypeScript
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-11-20.acacia" as any,
    });
  }
  async createPaymentIntent(params: {
    amount: number; // in cents
    currency: string;
    metadata: {
      datasetId: string;
      buyerId: string;
      datasetTitle: string;
    };
  }) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }
  async verifyWebhookSignature(
    payload: Buffer | string,
    signature: string
  ): Promise<Stripe.Event> {
    // stripe.webhooks.constructEvent accepts the raw payload (string or Buffer)
    return this.stripe.webhooks.constructEvent(
      payload as any,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
  async retrievePaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

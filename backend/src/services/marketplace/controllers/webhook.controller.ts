import { Request, Response } from "express";
import { StripeService } from "../payment/stripe.service";
import prisma from "../../../config/database";
import earningsService from "../../dashboard/services/earnings.service";
import { logger } from "../../../shared/utils/logger";
export class WebhookController {
  private stripeService: StripeService;
  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }
  async handleStripeWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"] as string | undefined;
      // `req.body` is expected to be a raw Buffer (or string) because we
      // registered `express.raw()` for this path in app.ts.
      const rawBody = req.body as Buffer | string;
      const event = await this.stripeService.verifyWebhookSignature(
        rawBody,
        signature || ""
      );
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(event.data.object as any);
          break;
        case "payment_intent.payment_failed":
          await this.handlePaymentFailure(event.data.object as any);
          break;
        default:
          logger.info(`Unhandled Stripe event: ${event.type}`);
      }
      res.json({ received: true });
    } catch (error: any) {
      logger.error("Stripe webhook error:", error);
      res.status(400).json({ error: "Webhook signature verification failed" });
    }
  }
  private async handlePaymentSuccess(paymentIntent: any) {
    const { datasetId, buyerId } = paymentIntent.metadata;
    // Create purchase record
    const purchase = await (prisma as any).purchase.create({
      data: {
        buyerId,
        datasetId,
        pricePaid: paymentIntent.amount / 100, // Convert from cents
        paymentMethod: "stripe",
        stripePaymentId: paymentIntent.id,
      },
    });

    logger.info(`✅ Purchase completed: ${datasetId} by ${buyerId}`);

    // Record earnings for the dataset creator (e.g. 30% split)
    try {
      const dataset = await (prisma as any).dataset.findUnique({
        where: { id: datasetId },
      });
      if (dataset && dataset.creatorId) {
        const earningAmount = Number(purchase.pricePaid ?? 0) * 0.3;
        await earningsService.recordEarning({
          userId: dataset.creatorId,
          datasetId,
          amount: earningAmount,
          type: "download",
          source: purchase.id,
        } as any);
        logger.info(
          `💰 Recorded earning ${earningAmount} for ${dataset.creatorId}`
        );
      } else {
        logger.warn(`Dataset not found when recording earning: ${datasetId}`);
      }
    } catch (e: any) {
      logger.error("Failed to record earning after purchase", e);
    }
  }
  private async handlePaymentFailure(paymentIntent: any) {
    logger.error(
      `❌ Payment failed: ${paymentIntent.id}`,
      paymentIntent.last_payment_error
    );
  }
}

import prisma from "@/lib/prisma";
import { escapeHtml, sendEmail } from "@/lib/email/client";
import { getSiteBaseUrl } from "@/lib/site-url";

function baseUrl(): string {
  return getSiteBaseUrl();
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn("Email not configured — skipping order confirmation");
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          artwork: true,
          ticketType: { include: { event: true } },
          productVariant: { include: { product: true } },
        },
      },
      tickets: {
        include: { ticketType: { include: { event: true } } },
      },
    },
  });

  if (!order) return;
  // Guest ticket buyers have no User; their snapshot contact is the recipient.
  const recipient = order.user?.email ?? order.guestEmail;
  if (!recipient) return;

  const lineItems = order.items.map((item) => {
    let label = String(item.itemType);
    if (item.artwork) label = `Artwork — ${item.artwork.title}`;
    if (item.ticketType) {
      label = `Ticket — ${item.ticketType.name} (${item.ticketType.event.title})`;
    }
    if (item.productVariant) {
      label = `Product — ${item.productVariant.product.name} (${item.productVariant.sku})`;
    }
    return `${label} × ${item.quantity} — ${formatMoney(
      item.unitPrice.toNumber() * item.quantity,
      order.currency
    )}`;
  });

  const ticketCodes =
    order.tickets.length > 0
      ? order.tickets.map((t) => t.code).join(", ")
      : null;

  // Ticket orders: show event details, the door codes, and a secure retrieval
  // link where the QR is rendered (QR images in email are often blocked).
  const retrievalUrl = order.retrievalToken
    ? `${baseUrl()}/tickets/retrieve?token=${order.retrievalToken}`
    : `${baseUrl()}/tickets/retrieve`;
  const ticketSection =
    order.tickets.length > 0
      ? `<h3>Your tickets</h3>
         ${order.tickets
           .map((t) => {
             const event = t.ticketType?.event;
             const when = event?.startsAt
               ? new Date(event.startsAt).toUTCString()
               : "";
             return `<p><strong>${escapeHtml(t.ticketType?.name ?? "Ticket")}</strong>${
               event ? ` — ${escapeHtml(event.title)}` : ""
             }<br/>${event?.venue ? `${escapeHtml(event.venue)}<br/>` : ""}${
               when ? `${escapeHtml(when)}<br/>` : ""
             }Code: <strong>${escapeHtml(t.code)}</strong></p>`;
           })
           .join("")}
         <p><a href="${escapeHtml(retrievalUrl)}">View and save your QR ticket(s)</a></p>`
      : "";

  const html = `
    <p>Thank you for your purchase from Jojjy Gallery.</p>
    <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
    <p><strong>Total:</strong> ${escapeHtml(formatMoney(order.amount.toNumber(), order.currency))}</p>
    <h3>Items</h3>
    <ul>${lineItems.map((li) => `<li>${escapeHtml(li)}</li>`).join("")}</ul>
    ${ticketSection}
    ${
      order.deliveryMethod
        ? `<p><strong>Delivery:</strong> ${escapeHtml(order.deliveryMethod)}</p>`
        : ""
    }
    ${
      order.deliveryAddress
        ? `<p><strong>Address:</strong> ${escapeHtml(order.deliveryAddress)}</p>`
        : ""
    }
    <p>We will be in touch if anything else is needed for delivery or entry.</p>
  `;

  const result = await sendEmail({
    to: recipient,
    subject: order.tickets.length
      ? `Your tickets — Jojjy Gallery (${order.id.slice(0, 8)})`
      : `Order confirmed — Jojjy Gallery (${order.id.slice(0, 8)})`,
    html,
    text: [
      "Thank you for your purchase from Jojjy Gallery.",
      `Order ID: ${order.id}`,
      `Total: ${formatMoney(order.amount.toNumber(), order.currency)}`,
      ...lineItems,
      ticketCodes ? `Ticket codes: ${ticketCodes}` : "",
      order.tickets.length ? `View tickets: ${retrievalUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (!result.ok && !result.skipped) {
    throw new Error(result.error || "Failed to send order confirmation");
  }
}

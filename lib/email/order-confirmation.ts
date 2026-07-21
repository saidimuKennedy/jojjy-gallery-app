import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
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
      tickets: true,
    },
  });

  if (!order?.user.email) return;

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

  const html = `
    <p>Thank you for your purchase from Jojjy Gallery.</p>
    <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
    <p><strong>Total:</strong> ${escapeHtml(formatMoney(order.amount.toNumber(), order.currency))}</p>
    <h3>Items</h3>
    <ul>${lineItems.map((li) => `<li>${escapeHtml(li)}</li>`).join("")}</ul>
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
    ${
      ticketCodes
        ? `<p><strong>Ticket codes:</strong> ${escapeHtml(ticketCodes)}</p>`
        : ""
    }
    <p>We will be in touch if anything else is needed for delivery or entry.</p>
  `;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.user.email,
    subject: `Order confirmed — Jojjy Gallery (${order.id.slice(0, 8)})`,
    html,
    text: [
      "Thank you for your purchase from Jojjy Gallery.",
      `Order ID: ${order.id}`,
      `Total: ${formatMoney(order.amount.toNumber(), order.currency)}`,
      ...lineItems,
      ticketCodes ? `Ticket codes: ${ticketCodes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

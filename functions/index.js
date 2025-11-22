// --------------------------------------------------------
// Firebase Functions v2 (Node.js 20/22)
// --------------------------------------------------------
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Secret (SendGrid)
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");

// Helper
const getKey = (context) => SENDGRID_SECRET.value();


// --------------------------------------------------------
// 1️⃣ Newsletter Subscription
// --------------------------------------------------------
exports.subscribeToNewsletter = onCall(
  { secrets: [SENDGRID_SECRET] },
  async (request, context) => {
    try {
      const { email } = request.data;

      if (!email) {
        return { success: false, message: "Email is required!" };
      }

      // Store subscriber
      await admin.firestore().collection("subscribers").add({
        email,
        subscribedAt: new Date().toISOString(),
      });

      // Use secret
      sgMail.setApiKey(getKey(context));

      await sgMail.send({
        to: email,
        from: "trendsalena@gmail.com",
        subject: "🎉 Welcome to AlenaTrends Newsletter!",
        html: `
          <h2>Welcome 🎉</h2>
          <p>You are now subscribed to AlenaTrends updates.</p>
        `,
      });

      return { success: true };
    } catch (err) {
      console.error("❌ subscribeToNewsletter error:", err);
      throw new Error("Internal server error");
    }
  }
);


// --------------------------------------------------------
// 2️⃣ Notify subscribers when product is added
// --------------------------------------------------------
exports.notifySubscribers = onDocumentCreated(
  { document: "products/{productId}", secrets: [SENDGRID_SECRET] },
  async (event, context) => {
    try {
      const product = event.data?.data();
      if (!product) return null;

      sgMail.setApiKey(getKey(context));

      const snapshot = await admin.firestore().collection("subscribers").get();
      const emails = snapshot.docs.map((d) => d.data().email);

      if (emails.length === 0) return null;

      await sgMail.sendMultiple({
        to: emails,
        from: "trendsalena@gmail.com",
        subject: `New Product: ${product.title}`,
        html: `<h2>${product.title}</h2><p>${product.description || ""}</p>`,
      });

      console.log("📧 Sent new product alert");
      return null;
    } catch (err) {
      console.error("❌ notifySubscribers error:", err);
      return null;
    }
  }
);


// --------------------------------------------------------
// 3️⃣ Order Status Change Notification
// --------------------------------------------------------
exports.onOrderStatusChange = onDocumentUpdated(
  { document: "orders/{orderId}" },
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (!before || !after) return null;
      if (before.status === after.status) return null;

      await admin
        .firestore()
        .collection("users")
        .doc(after.userId)
        .collection("notifications")
        .add({
          type: "order",
          title: "Order Status Updated",
          message: `Your order status is now ${after.status}`,
          read: false,
          createdAt: new Date().toISOString(),
          icon: "fas fa-box",
        });

      console.log("📦 Order status notification sent");
      return null;
    } catch (err) {
      console.error("❌ onOrderStatusChange error:", err);
      return null;
    }
  }
);


// --------------------------------------------------------
// 4️⃣ Coupon Notification
// --------------------------------------------------------
exports.onNewCoupon = onDocumentCreated(
  { document: "coupons/{couponId}" },
  async (event) => {
    try {
      const coupon = event.data?.data();
      if (!coupon || !coupon.isActive) return null;

      const users = await admin.firestore().collection("users").get();
      const batch = admin.firestore().batch();

      users.docs.forEach((u) =>
        batch.set(
          u.ref.collection("notifications").doc(),
          {
            type: "coupon",
            title: "🎉 New Coupon!",
            message: `Use code ${coupon.code} for ${
              coupon.type === "percentage" ? coupon.value + "%" : "₹" + coupon.value
            } OFF`,
            read: false,
            createdAt: new Date().toISOString(),
            icon: "fas fa-ticket-alt",
          }
        )
      );

      await batch.commit();

      console.log("🎟 Coupon notifications sent");
      return null;
    } catch (err) {
      console.error("❌ onNewCoupon error:", err);
      return null;
    }
  }
);

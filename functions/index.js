const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Use .env config param (modern approach)
const sendgridKey = defineString("SENDGRID_API_KEY");

exports.notifySubscribers = onDocumentCreated("products/{productId}", async (event) => {
  // Set API key inside function, from config param
  sgMail.setApiKey(sendgridKey.value());

  const product = event.data;
  const subsSnapshot = await admin.firestore().collection("subscribers").get();
  const emails = subsSnapshot.docs.map((doc) => doc.data().email);

  const msg = {
    to: emails,
    from: "your@email.com", // replace with your verified SendGrid sender email
    subject: `New Product: ${product.title}`,
    html: `<p>Check out our new product: ${product.title}</p><p>${product.description || ""}</p>`,
  };

  try {
    await sgMail.sendMultiple(msg);
    console.log("Emails sent successfully");
  } catch (error) {
    console.error("SendGrid Error:", error);
  }

  return null;
});
